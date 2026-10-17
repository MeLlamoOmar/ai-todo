"""Exercise the real local Edge Function and SQL concurrency without production access.

Requires the local Supabase stack, applied migrations, a running function, and psql.
Creates two disposable users and removes only their fixtures in finally.
Never prints API keys, JWTs, integration credentials, or request bodies.
"""

import base64
import concurrent.futures
import hashlib
import hmac
import json
import os
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid


def require(condition, description):
    if not condition:
        raise AssertionError(description)


def main():
    cli = subprocess.run(["pnpm", "exec", "supabase", "status", "-o", "json"], capture_output=True, text=True)
    require(cli.returncode == 0, "Start local Supabase first.")
    status = json.loads(cli.stdout)
    api = status["API_URL"].rstrip("/")
    db = urllib.parse.urlsplit(status["DB_URL"])
    require(urllib.parse.urlsplit(api).hostname in ("127.0.0.1", "localhost"), "Only a loopback API is allowed.")
    require(db.hostname in ("127.0.0.1", "localhost"), "Only a loopback database is allowed.")
    endpoint = api + "/functions/v1/integration-transactions"
    api_key = status.get("PUBLISHABLE_KEY") or status["ANON_KEY"]
    alice, bob = str(uuid.uuid4()), str(uuid.uuid4())

    def sql(statement):
        result = subprocess.run(["psql", "-X", "-qAt", "-v", "ON_ERROR_STOP=1",
                                 "-h", db.hostname, "-p", str(db.port), "-U", urllib.parse.unquote(db.username),
                                 "-d", db.path.lstrip("/")], input=statement, text=True, capture_output=True,
                                env={**os.environ, "PGPASSWORD": urllib.parse.unquote(db.password)})
        require(result.returncode == 0, "Local fixture SQL failed; no credentials were printed.")
        return result.stdout.strip()

    def jwt(owner):
        def encoded(value):
            return base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).rstrip(b"=")
        parts = encoded({"alg": "HS256", "typ": "JWT"}) + b"." + encoded({
            "sub": owner, "role": "authenticated", "aud": "authenticated", "exp": int(time.time()) + 600,
        })
        signature = hmac.new(status["JWT_SECRET"].encode(), parts, hashlib.sha256).digest()
        return (parts + b"." + base64.urlsafe_b64encode(signature).rstrip(b"=")).decode()

    def call(url, method, bearer, body=None, headers=None):
        payload = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(url, data=payload, method=method, headers={
            "apikey": api_key, "Authorization": "Bearer " + bearer,
            "Content-Type": "application/json", **(headers or {}),
        })
        try:
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.status, json.load(response)
        except urllib.error.HTTPError as response:
            return response.code, json.load(response)

    def rpc(owner, name, body=None):
        return call(api + "/rest/v1/rpc/" + name, "POST", jwt(owner), body or {})

    def post(token, operation, body):
        return call(endpoint, "POST", token, body, {"Idempotency-Key": operation})

    fixtures_created = False
    baseline = int(sql("SELECT count(*) FROM public.transactions;"))
    try:
        sql(f"INSERT INTO auth.users(id,email) VALUES ('{alice}','{alice}@integration-test.invalid'), ('{bob}','{bob}@integration-test.invalid');")
        fixtures_created = True
        code, first = rpc(alice, "create_integration", {"p_name": "HTTP test iPhone"})
        require(code == 200 and "token" in first, "Authenticated creation must return a one-time token.")
        code, second = rpc(alice, "create_integration", {"p_name": "HTTP test iPad"})
        require(code == 200, "Multiple integrations must be allowed.")
        code, bob_token = rpc(bob, "create_integration", {"p_name": "HTTP test Bob"})
        require(code == 200, "Second account must be able to create its own integration.")

        code, metadata = rpc(alice, "list_integrations")
        require(code == 200 and len(metadata) == 2, "Listing must return only Alice integrations.")
        require(all("token" not in item and "token_hash" not in item for item in metadata), "Metadata must not expose credentials.")
        require(rpc(bob, "revoke_integration", {"p_integration_id": first["id"]}) == (200, False), "Cross-account revocation must fail.")
        code, _ = rpc(alice, "process_integration_transaction", {
            "p_token_hash": "0" * 64, "p_request_key": str(uuid.uuid4()), "p_values": {},
        })
        require(code >= 400, "Browser users must not execute the internal insert procedure.")
        print("PASS: authenticated management, metadata secrecy, and owner isolation", flush=True)

        code, catalog = call(endpoint + "/categories?type=expense", "GET", first["token"])
        require(code == 200 and {"value": "Food", "label": "Comida"} in catalog.get("categories", []), "Expense catalog must use current values and Spanish labels.")
        code, catalog = call(endpoint + "/categories?type=income", "GET", first["token"])
        require(code == 200 and {"value": "Salary", "label": "Salario"} in catalog.get("categories", []), "Income catalog must be type-specific.")
        require(call(endpoint + "/categories?type=expense", "GET", "it_" + "0" * 64)[0] == 401, "Unknown credentials must be rejected.")
        print("PASS: real Edge runtime, scoped token authorization, and dynamic categories", flush=True)

        values = {"type": "expense", "amount": 350.5, "description": "Local integration test", "category": "Food", "date": "2026-10-17"}
        operation = str(uuid.uuid4())
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            receipts = list(pool.map(lambda _: post(first["token"], operation, values), range(8)))
        require(sum(code == 201 for code, _ in receipts) == 1, "Concurrent retries must create exactly one transaction.")
        require(all(code in (200, 201) for code, _ in receipts), "Other concurrent retries must return their receipt.")
        require(len({body["transaction_id"] for _, body in receipts}) == 1, "All retries must refer to the same transaction.")
        require(post(second["token"], operation, values)[0] == 200, "Idempotency must survive changing integration tokens.")
        require(post(first["token"], operation, {**values, "amount": 351})[0] == 409, "Conflicting operation IDs must be rejected.")
        require(post(first["token"], str(uuid.uuid4()), {**values, "user_id": bob})[0] == 400, "The caller must not choose an owner.")
        require(post(bob_token["token"], operation, {**values, "type": "income", "category": "Salary"})[0] == 201, "Different owners have separate idempotency keys.")
        require(int(sql(f"SELECT count(*) FROM public.transactions WHERE user_id = '{alice}';")) == 1, "Alice must have one saved transaction.")
        sql(f"DELETE FROM public.transactions WHERE user_id = '{alice}';")
        require(post(second["token"], operation, values)[0] == 200, "A deleted transaction must keep its operation receipt.")
        require(int(sql(f"SELECT count(*) FROM public.transactions WHERE user_id = '{alice}';")) == 0, "Retry must not recreate a deleted transaction.")
        print("PASS: concurrent idempotency, conflicts, and retained receipts", flush=True)

        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            issued = list(pool.map(lambda i: rpc(alice, "create_integration", {"p_name": f"Concurrent test {i}"}), range(8)))
        require(sum(code == 200 for code, _ in issued) == 3, "Concurrent issuance must stop at five active integrations.")
        require(len(rpc(alice, "list_integrations")[1]) == 5, "Exactly five integrations must exist for Alice.")
        print("PASS: concurrent issuance enforces the five-active-token limit", flush=True)

        if time.time() % 60 > 48:
            print("Waiting for a fresh minute to test the concurrent rate limit...", flush=True)
            time.sleep(61 - time.time() % 60)
        sql(f"DELETE FROM private.integration_rate_limits WHERE user_id = '{alice}';")
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as pool:
            results = list(pool.map(lambda i: call(endpoint + "/categories?type=expense", "GET", (first if i % 2 else second)["token"]), range(35)))
        require(sum(code == 200 for code, _ in results) == 30, "Thirty requests per account must be allowed.")
        require(sum(code == 429 for code, _ in results) == 5, "Other requests must be rate-limited across tokens and workers.")
        print("PASS: real concurrent rate limit shared by all account tokens", flush=True)

        require(rpc(alice, "revoke_integration", {"p_integration_id": first["id"]}) == (200, True), "Owner must be able to revoke a token.")
        require(post(first["token"], operation, values)[0] == 401, "Revocation must also deny receipt replays.")
        sql(f"UPDATE private.integration_tokens SET expires_at = clock_timestamp() - interval '1 second', created_at = clock_timestamp() - interval '2 days' WHERE id = '{bob_token['id']}';")
        require(call(endpoint + "/categories?type=income", "GET", bob_token["token"])[0] == 401, "Expired tokens must be rejected.")
        print("PASS: revocation and expiration are enforced by the deployed local handler", flush=True)
    finally:
        if fixtures_created:
            sql(f"DELETE FROM public.transactions WHERE user_id IN ('{alice}','{bob}'); DELETE FROM auth.users WHERE id IN ('{alice}','{bob}');")
            require(int(sql("SELECT count(*) FROM public.transactions;")) == baseline, "The original transaction count must be preserved.")
            print("Local fixtures removed; original transaction count preserved.", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # No response objects or secrets are interpolated into errors above.
        print(f"FAIL: {error}")
        raise SystemExit(1) from None
