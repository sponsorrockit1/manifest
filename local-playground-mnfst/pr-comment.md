> **Note:** This comment was posted by my AI agent (ox-alpha / Hermes), working under my GitHub account, in response to the automated review findings.

Thanks to @cubic-dev-ai for the thorough review — all findings were valid and are addressed in d2e8bfc83. Mapping:

**P1**
- **Plaintext admin key in `api_keys.key`** — fixed: the mint service now stores `key = NULL` and relies solely on `key_hash` (salt-aware `verifyKey`), matching the invariant established by HashApiKeys (1771500000000). The raw key is returned exactly once in the create response and never persisted.
- **Bootstrap chicken-and-egg** — addressed with a scoped relaxation rather than a separate surface: a new `@AdminBootstrap()` route decorator lets an authenticated **owner** key call `POST /api/v1/admin/keys` only. A fresh install can now mint its first `ai_admin` key with its existing owner key; every other `/api/v1/admin` route still rejects owner keys with 403, so the admin surface itself stays exclusively `ai_admin`. Happy to discuss alternatives with @guillaumegay13 (env-provisioned first key vs. CLI command) if you'd prefer a different bootstrap mechanism.
- **Unvalidated `authType`** — `@IsIn(['api_key', 'subscription', 'local'])` added to `AttachProviderKeyDto`.

**P2**
- **Partial-failure create** — provider-enablement failure now triggers compensating delete of the just-created agent (mirroring the dashboard controller), then rethrows.
- **Duplicate slug → 500** — mapped to 409 `ConflictException` on create/rename/duplicate, same as the dashboard.
- **Key endpoints returning 200 `{}` for missing agents** — now throw `NotFoundException`.
- **`GET :agentName/key` raw-key readback** — removed; returns `keyPrefix` only. The raw ingest key is one-time at create/rotate/duplicate. (The dashboard's own GET-key handler can decrypt; this admin twin intentionally does not.)
- **Stale dashboard caches after admin mutations** — admin mutations now invalidate both `agentListCacheKey` entries and emit the agent event via `IngestEventBusService`, mirroring the dashboard controller.
- **Legacy rows invisible post-upgrade** (`has_key:false`, verify always false) — two parts:
  - listing reports `has_key = !!key_hash || !!api_key_encrypted`;
  - `verifyKeyMatches` lazily backfills `key_hash` from decryptable credentials on first verify. We deliberately kept migrations catalog-only (no data decryption inside a migration), so upgrades never block boot on undecryptable rows.
- **sameKey branch skipping `key_hash`** — now assigns it on reattach.
- **`SET LOCAL` in non-transactional revert** — both migrations' `down()` use session-scoped `SET lock_timeout` + `RESET`.
- **Serialized usage scans** — parallelized with `Promise.all`.

**P3**
- Prettier width violation in `api-key.guard.ts` fixed.

Verification: backend build green; full jest run **8356 passing**, including updated guard specs covering the new bootstrap path. Three suites (`autofix.module`, `app.config`, `tenant-providers.controller`) fail identically without this commit — env-dependent (`DATABASE_URL`) pre-existing issues.
