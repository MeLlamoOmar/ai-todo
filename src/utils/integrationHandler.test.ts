import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIntegrationHandler } from '../../supabase/functions/integration-transactions/handler';

const url = 'http://localhost/functions/v1/integration-transactions';
const token = `it_${'a'.repeat(64)}`;
const key = '30000000-0000-4000-8000-000000000001';
const transactionId = '40000000-0000-4000-8000-000000000001';
const values = { type: 'expense', amount: 350.5, description: '  Lunch  ', category: 'Food', date: '2026-10-17' };
const authorize = vi.fn();
const create = vi.fn();
const handle = createIntegrationHandler({ authorize, create });

function request(body: unknown = values, headers: Record<string, string> = {}) {
  return new Request(url, { method: 'POST', headers: {
    Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key, ...headers,
  }, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  authorize.mockResolvedValue({ status: 200 });
  create.mockResolvedValue({ status: 201, transaction_id: transactionId, duplicate: false });
});

describe('integration HTTP handler', () => {
  it('hashes the credential, normalizes input, and returns only a receipt', async () => {
    const response = await handle(request());
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.stringMatching(/^[0-9a-f]{64}$/), key, { ...values, description: 'Lunch' });
    expect(create.mock.calls[0][0]).not.toBe(token);
    expect(await response.json()).toEqual({ ok: true, transaction_id: transactionId, duplicate: false });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('fetches current categories with stable values and Spanish labels', async () => {
    const response = await handle(new Request(`${url}/categories?type=expense`, { headers: { Authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.categories).toContainEqual({ value: 'Food', label: 'Comida' });
    expect(data.categories).not.toContainEqual(expect.objectContaining({ value: 'Salary' }));
    expect(authorize).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it('does not return the category catalog for a revoked token', async () => {
    authorize.mockResolvedValue({ status: 401, code: 'invalid_token', message: 'Integration token is invalid or expired.' });
    const response = await handle(new Request(`${url}/categories?type=income`, { headers: { Authorization: `Bearer ${token}` } }));
    expect(response.status).toBe(401);
    expect(await response.json()).not.toHaveProperty('categories');
  });

  it.each(['', 'Bearer sb_secret_do-not-use', 'Bearer it_short', 'Basic anything'])(
    'rejects absent or unsupported credentials: %s', async (Authorization) => {
      expect((await handle(request(values, { Authorization }))).status).toBe(401);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it.each([null, [], {}, { ...values, amount: '350' }, { ...values, amount: 0 },
    { ...values, description: 123 }, { ...values, date: '2026-02-30' },
    { ...values, type: 'income', category: 'Food' }, { ...values, user_id: 'another-user' },
    { ...values, id: transactionId }, { ...values, category: 'Unlisted' }])(
    'rejects invalid or impersonating transaction data: %j', async (body) => {
      expect((await handle(request(body))).status).toBe(400);
      expect(create).not.toHaveBeenCalled();
    },
  );

  it('requires a valid operation UUID', async () => {
    expect((await handle(request(values, { 'Idempotency-Key': 'missing-uuid' }))).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('requires JSON and handles invalid JSON without echoing it', async () => {
    expect((await handle(request(values, { 'Content-Type': 'text/plain' }))).status).toBe(415);
    const response = await handle(new Request(url, { method: 'POST', headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key,
    }, body: 'secret-invalid-json' }));
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('secret-invalid-json');
  });

  it('limits body bytes even when Content-Length is missing', async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(9000)); }, cancel });
    const response = await handle(new Request(url, Object.assign({ method: 'POST', headers: {
      Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Idempotency-Key': key,
    }, body: stream }, { duplex: 'half' })));
    expect(response.status).toBe(413);
    expect(cancel).toHaveBeenCalledOnce();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([200, 401, 403, 409, 429])('preserves database result status %i', async (status) => {
    create.mockResolvedValue(status === 200 ? { status, transaction_id: transactionId, duplicate: true }
      : { status, code: 'test_error', message: 'Request rejected.', ...(status === 429 ? { retry_after: 30 } : {}) });
    const response = await handle(request());
    expect(response.status).toBe(status);
    expect((await response.json()).ok).toBe(status < 400);
    if (status === 429) expect(response.headers.get('retry-after')).toBe('30');
  });

  it('masks internal errors and credentials', async () => {
    create.mockRejectedValue(new Error(`Database credentials ${token}`));
    const response = await handle(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain(token);
  });

  it('rejects other routes and methods', async () => {
    expect((await handle(new Request(`${url}/delete`))).status).toBe(404);
    expect((await handle(new Request(url, { method: 'DELETE' }))).status).toBe(405);
    expect(create).not.toHaveBeenCalled();
  });
});
