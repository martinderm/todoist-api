import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

import { todoistRequest } from '../scripts/_todoist-client.mjs';
import { parseTasksPayload, createTasks } from '../scripts/create-tasks.mjs';
import { createSection, findOrCreateSection } from '../scripts/create-section.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CREATE_TASKS = path.join(REPO_ROOT, 'scripts', 'create-tasks.mjs');
const LIST_TASKS = path.join(REPO_ROOT, 'scripts', 'list-tasks.mjs');

const TODOIST_DOC = {
  integrations: {
    todoist: {
      accounts: {
        'primary@example.com': { apiToken: 'todoist-primary-token' }
      }
    }
  }
};

function makeResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return payload === null ? '' : JSON.stringify(payload);
    }
  };
}

function makeFetch(handlers) {
  const calls = [];
  const impl = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method, headers: init.headers, body: init.body });
    if (handlers.length === 0) {
      throw new Error('unexpected_fetch_call');
    }
    const handler = handlers.shift();
    return typeof handler === 'function' ? handler(url, init) : handler;
  };
  impl.calls = calls;
  return impl;
}

function makeTempDir(prefix = 'todoist-cli-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value), 'utf8');
  return filePath;
}

function writeLoader(dir) {
  const loaderPath = path.join(dir, 'fetch-loader.mjs');
  const source = [
    "import fs from 'node:fs';",
    'globalThis.fetch = async (url, init = {}) => {',
    "  const method = init.method ?? 'GET';",
    '  const target = String(url);',
    '  const capture = process.env.TODOIST_TEST_CAPTURE;',
    '  if (capture) {',
    "    fs.appendFileSync(capture, method + ' ' + target + '\\n');",
    '  }',
    "  if (process.env.TODOIST_TEST_FAIL_ALL === '1') {",
    "    return { ok: false, status: 400, text: async () => JSON.stringify({ error: 'forced_failure' }) };",
    '  }',
    "  if (target.includes('/tasks')) {",
    "    return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'task-fake', results: [], next_cursor: null }) };",
    '  }',
    "  return { ok: true, status: 200, text: async () => JSON.stringify({ id: 'section-fake' }) };",
    '};'
  ].join('\n');
  fs.writeFileSync(loaderPath, source, 'utf8');
  return loaderPath;
}

function makeWorkspace() {
  const dir = makeTempDir('todoist-ws-');
  fs.mkdirSync(path.join(dir, '.agents'));
  writeJson(path.join(dir, '.agents', 'secrets.json'), TODOIST_DOC);
  return dir;
}

function runCli(scriptPath, args, { workspaceRoot, capture, failAll, input } = {}) {
  const dir = makeTempDir('todoist-loader-');
  try {
    const loader = writeLoader(dir);
    const env = { ...process.env };
    if (workspaceRoot) env.WORKSPACE_ROOT = workspaceRoot;
    if (capture) env.TODOIST_TEST_CAPTURE = capture;
    if (failAll) env.TODOIST_TEST_FAIL_ALL = '1';

    return spawnSync(process.execPath, ['--import', pathToFileURL(loader).href, scriptPath, ...args], {
      encoding: 'utf8',
      env,
      cwd: REPO_ROOT,
      input
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function parseEnvelope(stdout) {
  return JSON.parse(stdout.trim());
}

test('todoistRequest uses injected secrets and fetchImpl without reading a secrets file', async () => {
  const fetchImpl = makeFetch([makeResponse({ id: 'T0' })]);

  const data = await todoistRequest({
    method: 'POST',
    path: '/tasks',
    body: { content: 'x' },
    fetchImpl,
    secrets: TODOIST_DOC
  });

  assert.deepEqual(data, { id: 'T0' });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].headers.Authorization, 'Bearer todoist-primary-token');
  assert.equal(fetchImpl.calls[0].headers['Content-Type'], 'application/json');
});

test('parseTasksPayload rejects non-array payloads', () => {
  assert.throws(() => parseTasksPayload('{"content":"x"}'), /batch_payload_must_be_array/);
});

test('parseTasksPayload rejects empty batches', () => {
  assert.throws(() => parseTasksPayload('[]'), /batch_empty/);
});

test('parseTasksPayload reports missing content with the entry index', () => {
  assert.throws(
    () => parseTasksPayload(JSON.stringify([{ content: 'ok' }, { description: 'no content' }])),
    /batch_entry_invalid:1:missing_content/
  );
});

test('parseTasksPayload propagates SyntaxError for invalid JSON', () => {
  assert.throws(() => parseTasksPayload('{ "content": '), SyntaxError);
});

test('createTasks posts entries sequentially and keeps input order', async () => {
  const entries = parseTasksPayload(
    JSON.stringify([
      { content: 'first' },
      { content: 'second', project_id: 'P1', priority: 2 },
      { content: 'third' }
    ])
  );
  const fetchImpl = makeFetch([
    makeResponse({ id: 'T1' }),
    makeResponse({ id: 'T2' }),
    makeResponse({ id: 'T3' })
  ]);

  const payload = await createTasks(entries, { fetchImpl, secrets: TODOIST_DOC });

  assert.equal(payload.ok, true);
  assert.equal(payload.total, 3);
  assert.equal(payload.created, 3);
  assert.equal(payload.failed_count, 0);
  assert.deepEqual(payload.failed, []);
  assert.deepEqual(payload.results.map((entry) => entry.index), [0, 1, 2]);
  assert.deepEqual(payload.results.map((entry) => entry.task.id), ['T1', 'T2', 'T3']);
  assert.equal(fetchImpl.calls.length, 3);
  assert.equal(fetchImpl.calls[0].method, 'POST');
  assert.equal(new URL(fetchImpl.calls[0].url).pathname, '/api/v1/tasks');
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].body), { content: 'second', project_id: 'P1', priority: 2 });
});

test('createTasks continues after a single failure and reports it by index', async () => {
  const entries = parseTasksPayload(JSON.stringify([{ content: 'a' }, { content: 'b' }, { content: 'c' }]));
  const fetchImpl = makeFetch([
    makeResponse({ id: 'T1' }),
    makeResponse({ error: 'bad' }, 400),
    makeResponse({ id: 'T3' })
  ]);

  const payload = await createTasks(entries, { fetchImpl, secrets: TODOIST_DOC });

  assert.equal(payload.ok, true);
  assert.equal(payload.total, 3);
  assert.equal(payload.created, 2);
  assert.equal(payload.failed_count, 1);
  assert.equal(payload.failed[0].index, 1);
  assert.equal(payload.failed[0].error, 'http_400');
  assert.equal(payload.failed[0].status, 400);
  assert.equal(payload.results[1].ok, false);
  assert.equal(fetchImpl.calls.length, 3);
});

test('createTasks reports ok=false when every entry fails', async () => {
  const entries = parseTasksPayload(JSON.stringify([{ content: 'a' }, { content: 'b' }]));
  const fetchImpl = makeFetch([makeResponse({ error: 'bad' }, 500), makeResponse({ error: 'bad' }, 500)]);

  const payload = await createTasks(entries, { fetchImpl, secrets: TODOIST_DOC });

  assert.equal(payload.ok, false);
  assert.equal(payload.created, 0);
  assert.equal(payload.failed_count, 2);
  assert.deepEqual(payload.failed.map((entry) => entry.index), [0, 1]);
});

test('findOrCreateSection returns an existing section without POST', async () => {
  const fetchImpl = makeFetch([
    makeResponse({ results: [{ id: 'S1', name: 'Existing' }], next_cursor: null })
  ]);

  const payload = await findOrCreateSection({
    name: 'Existing',
    project_id: 'P1',
    fetchImpl,
    secrets: TODOIST_DOC
  });

  assert.deepEqual(payload, { ok: true, section: { id: 'S1', name: 'Existing' }, created: false, existing: true });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].method, 'GET');
  const url = new URL(fetchImpl.calls[0].url);
  assert.equal(url.pathname, '/api/v1/sections');
  assert.equal(url.searchParams.get('project_id'), 'P1');
  assert.equal(url.searchParams.get('limit'), '200');
});

test('findOrCreateSection creates a section when the name is absent', async () => {
  const fetchImpl = makeFetch([
    makeResponse({ results: [{ id: 'S1', name: 'Other' }], next_cursor: null }),
    makeResponse({ id: 'S2', name: 'New' })
  ]);

  const payload = await findOrCreateSection({
    name: 'New',
    project_id: 'P1',
    fetchImpl,
    secrets: TODOIST_DOC
  });

  assert.deepEqual(payload, { ok: true, section: { id: 'S2', name: 'New' }, created: true });
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(fetchImpl.calls[0].method, 'GET');
  assert.equal(fetchImpl.calls[1].method, 'POST');
  assert.equal(new URL(fetchImpl.calls[1].url).pathname, '/api/v1/sections');
  assert.deepEqual(JSON.parse(fetchImpl.calls[1].body), { name: 'New', project_id: 'P1' });
});

test('findOrCreateSection follows next_cursor pagination', async () => {
  const fetchImpl = makeFetch([
    makeResponse({ results: [{ id: 'S0', name: 'Other' }], next_cursor: 'CUR1' }),
    makeResponse({ results: [{ id: 'S9', name: 'Target' }], next_cursor: null })
  ]);

  const payload = await findOrCreateSection({
    name: 'Target',
    project_id: 'P1',
    fetchImpl,
    secrets: TODOIST_DOC
  });

  assert.equal(payload.created, false);
  assert.equal(payload.section.id, 'S9');
  assert.equal(fetchImpl.calls.length, 2);
  const second = new URL(fetchImpl.calls[1].url);
  assert.equal(second.searchParams.get('cursor'), 'CUR1');
  assert.equal(second.searchParams.get('limit'), '200');
});

test('findOrCreateSection aborts after the pagination safety limit', async () => {
  const pages = Array.from({ length: 20 }, (_, index) => makeResponse({ results: [], next_cursor: `C${index + 1}` }));
  const fetchImpl = makeFetch(pages);

  await assert.rejects(
    () => findOrCreateSection({ name: 'Missing', project_id: 'P1', fetchImpl, secrets: TODOIST_DOC }),
    /section_pagination_limit_exceeded/
  );
  assert.equal(fetchImpl.calls.length, 20);
});

test('createSection without find-or-create posts directly without a prior GET', async () => {
  const fetchImpl = makeFetch([makeResponse({ id: 'S3', name: 'Direct' })]);

  const payload = await createSection({
    name: 'Direct',
    project_id: 'P1',
    fetchImpl,
    secrets: TODOIST_DOC
  });

  assert.deepEqual(payload, { ok: true, section: { id: 'S3', name: 'Direct' } });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].method, 'POST');
});

test('cli --file with a non-array payload exits 2 before any request', () => {
  const dir = makeTempDir();
  const file = writeJson(path.join(dir, 'tasks.json'), { content: 'x' });

  const result = spawnSync(process.execPath, [CREATE_TASKS, '--file', file], { encoding: 'utf8', cwd: REPO_ROOT });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /batch_payload_must_be_array/);
});

test('cli --stdin parses piped payload and reports the entry index', () => {
  const result = spawnSync(process.execPath, [CREATE_TASKS, '--stdin'], {
    encoding: 'utf8',
    cwd: REPO_ROOT,
    input: JSON.stringify([{ content: 'ok' }, { description: 'missing' }])
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /batch_entry_invalid:1:missing_content/);
});

test('cli rejects conflicting --file and --stdin sources', () => {
  const dir = makeTempDir();
  const file = writeJson(path.join(dir, 'tasks.json'), [{ content: 'x' }]);

  const result = spawnSync(process.execPath, [CREATE_TASKS, '--file', file, '--stdin'], {
    encoding: 'utf8',
    cwd: REPO_ROOT
  });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /batch_source_conflict/);
});

test('cli without any source exits 2 with missing_batch_source', () => {
  const result = spawnSync(process.execPath, [CREATE_TASKS], { encoding: 'utf8', cwd: REPO_ROOT });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /missing_batch_source/);
});

test('cli with a missing --file exits 2 with batch_file_not_found', () => {
  const dir = makeTempDir();
  const missing = path.join(dir, 'nope.json');

  const result = spawnSync(process.execPath, [CREATE_TASKS, '--file', missing], { encoding: 'utf8', cwd: REPO_ROOT });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /batch_file_not_found/);
});

test('cli with a directory as --file exits 2 with batch_file_unreadable', () => {
  const dir = makeTempDir();

  const result = spawnSync(process.execPath, [CREATE_TASKS, '--file', dir], { encoding: 'utf8', cwd: REPO_ROOT });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /batch_file_unreadable/);
});

test('cli batch success exits 0 and reports the created count', () => {
  const workspaceRoot = makeWorkspace();
  const dir = makeTempDir();
  const file = writeJson(path.join(dir, 'tasks.json'), [{ content: 'a' }, { content: 'b' }]);

  const result = runCli(CREATE_TASKS, ['--file', file], { workspaceRoot });

  assert.equal(result.status, 0, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.equal(envelope.ok, true);
  assert.equal(envelope.created, 2);
  assert.equal(envelope.failed_count, 0);
});

test('cli batch total failure exits 1', () => {
  const workspaceRoot = makeWorkspace();
  const dir = makeTempDir();
  const file = writeJson(path.join(dir, 'tasks.json'), [{ content: 'a' }, { content: 'b' }]);

  const result = runCli(CREATE_TASKS, ['--file', file], { workspaceRoot, failAll: true });

  assert.equal(result.status, 1, result.stderr);
  const envelope = parseEnvelope(result.stdout);
  assert.equal(envelope.ok, false);
  assert.equal(envelope.created, 0);
  assert.equal(envelope.failed_count, 2);
});

test('list-tasks --section-id forwards the section_id query parameter', () => {
  const workspaceRoot = makeWorkspace();
  const dir = makeTempDir();
  const capture = path.join(dir, 'capture.log');

  const result = runCli(LIST_TASKS, ['--section-id', 'SEC123', '--limit', '5'], { workspaceRoot, capture });

  assert.equal(result.status, 0, result.stderr);
  const lines = fs.readFileSync(capture, 'utf8').trim().split('\n');
  assert.equal(lines.length, 1);
  assert.match(lines[0], /section_id=SEC123/);
  assert.match(lines[0], /limit=5/);
});
