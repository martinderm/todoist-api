import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.todoist.com/api/v1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const rawRoot = path.resolve(__dirname, '..', '..', '..');
const deepScriptRoot = path.basename(rawRoot) === '.agents' ? path.dirname(rawRoot) : rawRoot;
const directScriptRoot = path.resolve(__dirname, '..', '..');
const scriptRoot = directScriptRoot;

function uniquePaths(paths) {
  return [...new Set(paths.filter(Boolean).map((entry) => path.resolve(entry)))];
}

function collectAncestors(startPath) {
  if (!startPath) {
    return [];
  }

  const resolved = path.resolve(startPath);
  const ancestors = [];
  let current = resolved;

  while (true) {
    ancestors.push(current);
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  return ancestors;
}

function looksLikeWorkspaceRoot(dirPath) {
  return [
    path.join(dirPath, 'settings.json'),
    path.join(dirPath, 'AGENTS.md'),
    path.join(dirPath, '.agents'),
    path.join(dirPath, 'secrets.json')
  ].some((candidate) => fs.existsSync(candidate));
}

function candidateWorkspaceRoots() {
  const envRoot = process.env.WORKSPACE_ROOT;
  const logicalPwd = process.env.PWD;
  const cwdAncestors = collectAncestors(process.cwd());
  const logicalPwdAncestors = collectAncestors(logicalPwd);
  const argvScriptRoot = process.argv[1]
    ? path.resolve(path.dirname(path.resolve(process.argv[1])), '..', '..', '..')
    : null;
  const derivedRoots = [
    envRoot,
    logicalPwd,
    process.cwd(),
    argvScriptRoot,
    directScriptRoot,
    deepScriptRoot
  ];

  const discovered = [];
  for (const candidate of uniquePaths([...derivedRoots, ...cwdAncestors, ...logicalPwdAncestors])) {
    if (looksLikeWorkspaceRoot(candidate)) {
      discovered.push(candidate);
    }
  }

  return uniquePaths(discovered);
}

export function resolveWorkspaceRoot() {
  const roots = candidateWorkspaceRoots();
  return roots[0] || scriptRoot;
}

function candidateSecretsPaths() {
  const workspaceCandidates = candidateWorkspaceRoots().flatMap((root) => [
    path.join(root, '.agents', 'secrets.json'),
    path.join(root, 'secrets.json')
  ]);

  return uniquePaths([
    ...workspaceCandidates,
    path.join(REPO_ROOT, 'secrets.json'),
    path.join(os.homedir(), '.openclaw', 'secrets.json')
  ]);
}

function hasTodoistCredentials(document) {
  const accounts = document?.integrations?.todoist?.accounts;
  return Boolean(accounts) && typeof accounts === 'object' && Object.keys(accounts).length > 0;
}

export function loadSecretsJson(candidatePaths = candidateSecretsPaths()) {
  const tried = [];
  let fallback;
  let hasFallback = false;

  for (const secretsPath of candidatePaths) {
    tried.push(secretsPath);
    if (!fs.existsSync(secretsPath)) {
      continue;
    }

    const raw = fs.readFileSync(secretsPath, 'utf8');
    const document = JSON.parse(raw);

    if (!hasFallback) {
      fallback = document;
      hasFallback = true;
    }

    if (hasTodoistCredentials(document)) {
      return document;
    }
  }

  if (!hasFallback) {
    throw new Error(`missing_secrets_file:${tried.join('|')}`);
  }

  return fallback;
}

function resolveAccount(secrets, requestedAccount) {
  if (requestedAccount) {
    return requestedAccount;
  }

  const accounts = secrets?.integrations?.todoist?.accounts;
  if (!accounts || typeof accounts !== 'object') {
    return null;
  }

  const firstAccount = Object.keys(accounts).find((key) => Boolean(key));
  return firstAccount ?? null;
}

export function loadApiToken(account) {
  const secrets = loadSecretsJson();
  const resolvedAccount = resolveAccount(secrets, account);
  if (!resolvedAccount) {
    throw new Error('missing_account_ref');
  }

  const accountConfig = secrets?.integrations?.todoist?.accounts?.[resolvedAccount];
  const apiToken =
    accountConfig?.apiToken ??
    accountConfig?.token ??
    accountConfig?.accessToken ??
    null;

  if (!apiToken) {
    throw new Error(`missing_api_token:${resolvedAccount}`);
  }

  return apiToken;
}

function buildUrl(resourcePath, query) {
  const url = new URL(`${API_BASE}${resourcePath}`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return url;
}

function buildError(status, body) {
  const error = new Error(`http_${status}`);
  error.status = status;
  error.body = body;
  return error;
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function todoistRequest({
  method = 'GET',
  path: resourcePath,
  query,
  body,
  account,
  headers = {}
} = {}) {
  const token = loadApiToken(account);
  const response = await fetch(buildUrl(resourcePath, query), {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw buildError(response.status, payload);
  }

  return payload;
}

export async function todoistSync({
  syncToken = '*',
  resourceTypes = ['projects', 'items', 'sections', 'labels'],
  account
} = {}) {
  const token = loadApiToken(account);
  const form = new URLSearchParams();
  form.set('sync_token', syncToken);
  form.set('resource_types', JSON.stringify(resourceTypes));

  const response = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: form.toString()
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw buildError(response.status, payload);
  }

  return payload;
}

export function assertServerId(value, name = 'id') {
  const resolved = String(value ?? '').trim();
  if (!resolved) {
    throw new Error(`missing_${name}`);
  }
  if (resolved.startsWith('tmp-')) {
    throw new Error(`placeholder_id_not_allowed:${name}`);
  }
  return resolved;
}

export function printJson(obj) {
  process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
}

export function printError(error) {
  const payload = {
    ok: false,
    error: error?.message ?? 'unknown_error',
    status: error?.status ?? null,
    body: error?.body ?? null
  };
  process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
}
