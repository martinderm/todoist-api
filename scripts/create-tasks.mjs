import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertServerId, printError, printJson, todoistRequest } from './_todoist-client.mjs';

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--file' && next) {
      args.file = next;
      i += 1;
    } else if (arg === '--stdin') {
      args.stdin = true;
    }
  }

  return args;
}

export function parseTasksPayload(raw) {
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error('batch_payload_must_be_array');
  }

  if (parsed.length === 0) {
    throw new Error('batch_empty');
  }

  parsed.forEach((entry, index) => {
    const content = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry.content : undefined;

    if (typeof content !== 'string' || content.trim() === '') {
      throw new Error(`batch_entry_invalid:${index}:missing_content`);
    }
  });

  return parsed;
}

function buildTaskBody(entry) {
  const body = {
    content: entry.content
  };

  if (entry.description) {
    body.description = entry.description;
  }

  if (entry.project_id) {
    body.project_id = assertServerId(entry.project_id, 'project_id');
  }

  if (entry.section_id) {
    body.section_id = assertServerId(entry.section_id, 'section_id');
  }

  if (entry.priority !== undefined) {
    body.priority = entry.priority;
  }

  if (entry.deadline_date) {
    body.deadline = { date: entry.deadline_date };
  }

  if (entry.due_string) {
    body.due = { string: entry.due_string };
  }

  return body;
}

export async function createTasks(entries, { fetchImpl, secrets } = {}) {
  const results = [];
  const failed = [];
  let created = 0;

  for (let index = 0; index < entries.length; index += 1) {
    try {
      const task = await todoistRequest({
        method: 'POST',
        path: '/tasks',
        body: buildTaskBody(entries[index]),
        fetchImpl,
        secrets
      });

      created += 1;
      results.push({ index, ok: true, task });
    } catch (error) {
      const failure = {
        index,
        ok: false,
        error: error?.message ?? 'unknown_error',
        status: error?.status ?? null,
        body: error?.body ?? null
      };

      results.push(failure);
      failed.push(failure);
    }
  }

  return {
    ok: created > 0,
    total: entries.length,
    created,
    failed_count: failed.length,
    results,
    failed
  };
}

function readBatchSource(options) {
  if (options.file && options.stdin) {
    throw new Error('batch_source_conflict');
  }

  if (!options.file && !options.stdin) {
    throw new Error('missing_batch_source');
  }

  if (options.file) {
    if (!fs.existsSync(options.file)) {
      throw new Error('batch_file_not_found');
    }

    return fs.readFileSync(options.file, 'utf8');
  }

  return fs.readFileSync(0, 'utf8');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  let raw;
  try {
    raw = readBatchSource(options);
  } catch (error) {
    printError(error);
    process.exit(2);
  }

  let entries;
  try {
    entries = parseTasksPayload(raw);
  } catch (error) {
    printError(error);
    process.exit(2);
  }

  try {
    const payload = await createTasks(entries);
    printJson(payload);
    process.exit(payload.ok ? 0 : 1);
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
