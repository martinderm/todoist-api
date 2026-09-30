import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assertServerId, printError, printJson, todoistRequest } from './_todoist-client.mjs';

function parseInteger(value) {
  if (value === undefined) return undefined;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--name' && next) {
      args.name = next;
      i += 1;
    } else if (arg === '--project-id' && next) {
      args.project_id = next;
      i += 1;
    } else if (arg === '--order' && next) {
      args.order = parseInteger(next);
      i += 1;
    } else if (arg === '--find-or-create') {
      args.find_or_create = true;
    }
  }

  return args;
}

const SECTION_PAGINATION_PAGE_LIMIT = 20;

async function findSectionByName({ name, project_id, fetchImpl, secrets }) {
  let cursor;
  let pages = 0;

  while (true) {
    pages += 1;
    if (pages > SECTION_PAGINATION_PAGE_LIMIT) {
      throw new Error('section_pagination_limit_exceeded');
    }

    const query = { project_id, limit: 200 };
    if (cursor) {
      query.cursor = cursor;
    }

    const data = await todoistRequest({ path: '/sections', query, fetchImpl, secrets });
    const results = Array.isArray(data?.results) ? data.results : [];
    const match = results.find((section) => section?.name === name);

    if (match) {
      return match;
    }

    const nextCursor = data?.next_cursor ?? null;
    if (!nextCursor) {
      return null;
    }

    cursor = nextCursor;
  }
}

export async function findOrCreateSection({ name, project_id, order, fetchImpl, secrets } = {}) {
  const projectId = assertServerId(project_id, 'project_id');
  const existing = await findSectionByName({ name, project_id: projectId, fetchImpl, secrets });

  if (existing) {
    return { ok: true, section: existing, created: false, existing: true };
  }

  const body = { name, project_id: projectId };
  if (order !== undefined) {
    body.order = order;
  }

  const data = await todoistRequest({ method: 'POST', path: '/sections', body, fetchImpl, secrets });

  return { ok: true, section: data, created: true };
}

export async function createSection({ name, project_id, order, fetchImpl, secrets } = {}) {
  const body = {
    name,
    project_id: assertServerId(project_id, 'project_id')
  };

  if (order !== undefined) {
    body.order = order;
  }

  const data = await todoistRequest({ method: 'POST', path: '/sections', body, fetchImpl, secrets });

  return { ok: true, section: data };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.name) {
    printError(new Error('missing_name'));
    process.exit(2);
  }

  if (!options.project_id) {
    printError(new Error('missing_project_id'));
    process.exit(2);
  }

  if (options.order === null) {
    printError(new Error('order_must_be_integer'));
    process.exit(2);
  }

  try {
    const payload = options.find_or_create
      ? await findOrCreateSection({ name: options.name, project_id: options.project_id, order: options.order })
      : await createSection({ name: options.name, project_id: options.project_id, order: options.order });

    printJson(payload);
  } catch (error) {
    printError(error);
    process.exit(1);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;

if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
