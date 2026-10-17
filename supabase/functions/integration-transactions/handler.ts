import type { TransactionFormValues } from '../../../src/types/transaction.ts';
import type { IntegrationResult } from '../../../src/types/integration.ts';
import { validateTransactionValues } from '../../../src/utils/validateTransactionValues.ts';
import { getCategoryOptions, transactionCategories } from '../../../src/utils/transactionCategories.ts';

type Backend = {
  authorize: (hash: string) => Promise<IntegrationResult>;
  create: (hash: string, key: string, values: TransactionFormValues) => Promise<IntegrationResult>;
};

const maxBodyBytes = 8 * 1024;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fields = ['type', 'description', 'amount', 'category', 'date'];

function json(status: number, body: object, retryAfter?: number) {
  const headers: Record<string, string> = { 'Cache-Control': 'no-store' };
  if (retryAfter) headers['Retry-After'] = String(retryAfter);
  return Response.json(body, { status, headers });
}

function fail(status: number, code: string, message: string) {
  return json(status, { ok: false, code, message });
}

async function tokenHash(token: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) {
    throw new RangeError('Request body is too large.');
  }
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBodyBytes) {
        await reader.cancel();
        throw new RangeError('Request body is too large.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
}

export function createIntegrationHandler(backend: Backend) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/(?:functions\/v1\/)?integration-transactions(\/categories)?\/?$/);
    if (!match) return fail(404, 'not_found', 'Endpoint not found.');
    const isCatalog = Boolean(match[1]);
    if (request.method !== (isCatalog ? 'GET' : 'POST')) {
      return fail(405, 'method_not_allowed', 'This HTTP method is not supported.');
    }
    const token = request.headers.get('authorization')?.match(/^Bearer (it_[0-9a-f]{64})$/i)?.[1];
    if (!token) return fail(401, 'invalid_token', 'An integration token is required.');

    try {
      const hash = await tokenHash(token);
      if (isCatalog) {
        const result = await backend.authorize(hash);
        if (result.status !== 200) {
          const { status, ...body } = result;
          return json(status, { ok: false, ...body }, result.retry_after);
        }
        const type = url.searchParams.get('type');
        if (type !== 'income' && type !== 'expense') {
          return fail(400, 'invalid_type', 'Choose income or expense.');
        }
        return json(200, { ok: true, categories: getCategoryOptions(type) });
      }

      const key = request.headers.get('idempotency-key');
      if (!key || !uuidPattern.test(key)) {
        return fail(400, 'invalid_request_id', 'Idempotency-Key must be a UUID.');
      }
      if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
        return fail(415, 'invalid_content_type', 'Use application/json.');
      }
      let values: TransactionFormValues;
      try {
        const input = await readJson(request);
        values = validateTransactionValues(input);
        if (Object.keys(input as object).some((field) => !fields.includes(field))) {
          throw new Error('Only transaction fields are accepted. Do not send a user_id.');
        }
        if (!transactionCategories[values.type].includes(values.category)) {
          throw new Error('Choose a category from the current catalog for this transaction type.');
        }
      } catch (error) {
        if (error instanceof RangeError) return fail(413, 'body_too_large', 'Request body exceeds 8 KiB.');
        return fail(400, 'invalid_transaction', error instanceof Error && !(error instanceof SyntaxError) && !(error instanceof TypeError)
          ? error.message : 'Send valid transaction JSON.');
      }
      const { status, ...body } = await backend.create(hash, key, values);
      return json(status, { ok: status < 400, ...body }, body.retry_after);
    } catch {
      // Do not echo SDK errors: they may contain request or database details.
      return fail(500, 'service_unavailable', 'Could not process the request. Try again later.');
    }
  };
}
