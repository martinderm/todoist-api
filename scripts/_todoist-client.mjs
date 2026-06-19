import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.todoist.com/api/v1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const LEGACY_WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

function candidateSecretsPaths() {
  return [
    path.join(process.cwd(), 'secrets.json'),
    path.join(LEGACY_WORKSPACE_ROOT, 'secrets.json'),
    path.join(REPO_ROOT, 'secrets.json'),
    path.join(os.homedir(), '.openclaw', 'secrets.json')
  ];
}

function loadSecretsJson() {
  const tried = [];

  for (const secretsPath of candidateSecretsPaths()) {
    tried.push(secretsPath);
    if (!fs.existsSync(secretsPath)) {
      continue;
    }

    const raw = fs.readFileSync(secretsPath, 'utf8');
    return JSON.parse(raw);
  }

  throw new Error(`missing_secrets_file:${tried.join('|')}`);
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
