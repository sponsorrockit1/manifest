---
title: "mnfst Admin API — Meeting Talking Points & Demo Flow"
date: 2026-08-25
author: "grok (Hermes Agent, ox-alpha)"
purpose: "Founder meeting with Guillaume Gay (@guillaumegay13) — Thursday 2026-08-27, 9am PST"
subject: mnfst-admin-api
pr: "https://github.com/mnfst/manifest/pull/2747"
branch: "sponsorrockit1/manifest@feat/agent-admin-api"
related:
  - "[Admin API Build Plan](../ADMIN-API-PLAN.md)"
  - "[Market Research](./market-research-manifest.md)"
tags: [mnfst, manifest, admin-api, meeting-prep, demo]
---

# mnfst Admin API — Meeting Talking Points & Demo Flow

*Guillaume Gay (@guillaumegay13) — Thursday 2026-08-27, 9am PST*

---

## Part 1 — Opening frame (2 min)

**Who we are:** Txabl / SponsorRockIt. We run a multi-agent production stack (Hermes orchestrator + coder agents) on self-hosted mnfst, and we're an active contributor from your target ecosystem — your repo literally lists `hermes-agent` as a topic.

**Why we're here:** We hit the exact gap your architecture implies — our agents hold `mnfst_*` harness keys and can *serve through* mnfst, but can't *administer* it. So we built the missing piece as a contribution: **PR #2747 — a scoped Agent Admin API**, live in production on our box for weeks.

**The one-line thesis (align with their doctrine):**
> *"You said it yourselves: orchestrator > dumb router. Our orchestrator owns model decisions; your gateway owns reliability. The Admin API is the contract that lets those two layers talk — without handing agents owner credentials."*

⚠️ **Do NOT pitch "routing."** They publicly deprecated rule-based routing (HN 132-point post Jul 31; removal Sept 1). Any framing of "routing" must be *agent-managed tier configuration within their new tier model* — never reintroducing prompt-classification routing.

---

## Part 2 — What we built (5 min)

### v1 (merged-ready, PR #2747, M1–M6 done)
Thin layer over their existing services — **no duplicated logic**:

| Piece | What it does |
|---|---|
| `mnfst_admin_ai_*` key type | New scope (`ai_admin`) in `api_keys`; resolved by existing guard; restricted to `/api/v1/admin` by `AdminAiGuard` |
| Agent CRUD | Create/rename/rotate-key/duplicate/delete — reuses `AgentLifecycleService`, `ApiKeyGeneratorService`, etc. |
| Provider key attach + **match-verify** | `POST /providers/:id/key/verify` → `{match}` via `key_hash`. No secret echo, ever. Hash-only storage (plaintext eliminated) |
| Observability | Read-only usage/routing visibility reusing `TimeseriesQueriesService` |

**Security posture to emphasize:**
- Auth matrix proven live: **200 with ai_admin / 401 without / 403 with owner key**
- Admin keys stored **hash-only** (we fixed this proactively after cubic's review)
- Owner keys cannot touch the admin surface (one-way trust boundary), except the scoped `@AdminBootstrap()` mint path for fresh installs

### v1.1 (new commit, stacked on same branch)
- **Key management**: rotate / pause / resume + `key_last4` for UI display identity; self-pause forbidden (`self_management_forbidden`); resume is the only route a paused key can reach (`@AllowPausedKey`)
- **Agent-managed tier config** (their new post-router model): GET/PUT tiers, PUT fallbacks, POST reset-all under `/api/v1/admin/agents/:name/routing` — thin twin of their dashboard controller, identical tenant scoping + validation
- **Dashboard keys UI section**: named keys, copy-once reveal, confirm-on-destructive

---

## Part 3 — Demo flow (10 min, live against our production box)

All calls hit `http://100.84.145.125:62400/api/v1/admin/*` with a real `mnfst_admin_ai_*` key. Script: `exercise-admin-api.sh`.

1. **Auth matrix first** (30 sec) — same request three ways: no key → 401; owner key → 403; ai_admin key → 200. *"Scope enforcement is the whole design."*
2. **Create agent via API** (1 min) — `POST /admin/agents` returns ingest key once. Show the new agent appears in their dashboard.
3. **Provider key attach + match-verify** (2 min) — attach a provider key, then verify correct key → `{match:true}`, wrong key → `{match:false}`. Emphasize: *the raw secret is never returned or echoed.*
4. **Routing self-service** (2 min) — read tiers, set a fallback chain, trigger reset-all. Frame: *"our orchestrator adjusts its own tier config when a free provider throttles — no human, no owner credentials."*
5. **Observability read-back** (1 min) — per-agent usage from the admin surface.
6. **Pause/resume + rotate** (v1.1, 2 min) — pause a key → show 403 `key_paused` on other routes → resume works only via the exempted route → rotate invalidates old hash instantly.
7. **Dashboard keys UI** (1 min) — Account settings → AI admin keys: copy-once reveal, confirm dialogs.
8. **Rollback story** (30 sec) — compose digest pin preserved; one-line rollback. *"We're running your software in production carefully."*

---

## Part 4 — The Nexus integration proof point (3 min)

### The 60-second "why CICM exists" story (open with this)

> *"We run a high-end orchestrator bot delegating to cheaper executor bots. We kept hitting the same failure: the orchestrator would say 'do X' in its own dialect, and the lower-end model would interpret it differently — same words, different weights, wrong result. Classic comms problem, but between models.*
>
> *I've used DISC behavior profiles with humans — ~26 questions, learn someone's style, adapt yours so they actually hear you. I asked: why not apply that bot-to-bot? Every model has its own decisional weights, so before one bot instructs another, it reads how the other listens — DSPy-style — and shapes the instruction to match.*
>
> *That's CICM — our Cognitive Interoperability Calibration Module. It's implemented: 32 probe questions across 12 behavioral axes (truth-over-politeness, ambiguity tolerance, interpretive authority, agency disposition…), a Value Context Packet per pairing, a Mutual Intelligibility Score quantifying how well two models understand each other, message-wrapping that translates instructions through VCP rules pre-send, drift monitoring, and recalibration when friction shows up."*

**Why this matters to mnfst specifically:** their gateway moves requests reliably between models but has no concept that a nemotron-lightning interprets an ambiguous instruction differently than gpt-oss-120b. CICM fixes exactly that — and it pairs naturally with their agent-native key model and the v1.1 routing-write endpoints (a calibrated agent can act on its own calibration, e.g., select fallbacks whose profile fits the task).

### The integration frame

Frame as **a reference integration + design question**, not a pitch:

> *"On our side, we built a model-alignment layer in our Nexus orchestrator: per-agent model intent (`model_id`, `use_case_manifest_routes`) resolves onto your Key-Per-Route credentials via a resolver service. Your gateway handles reliability; our orchestrator handles intent. The Admin API was the missing contract between them."*

Why lead with this:
- It's a working real-world implementation of exactly the split they argued for in "Everyone is building LLM routers, we deprecated ours"
- It makes the Admin API look like the natural completion of their own architecture
- It invites design input — they engage deeply with technical contributors (see the bootstrap discussion on PR #2747)

**Caution:** don't call anything "exclusive/proprietary" — reads as lock-in to an OSS maintainer. Offer the integration learnings back as documentation or a second contribution if they want them.

**If Guillaume bites on CICM:** possible second-contribution angle — an optional `x-manifest-behavior-profile` header or agent metadata field letting calibrated agents advertise their listening profile through the gateway. Park it as a "worth exploring" unless he asks for detail.

---

## Part 5 — Asks & open questions (5 min)

### Primary ask
Accept PR #2747 (or tell us what shape you'd accept). It's non-breaking, additive paths only (`/api/v1/admin`), fully tested, changeset included, live-proven.

### Design questions where we want THEIR call
1. **Bootstrap mechanism**: we shipped owner-relaxed `POST /admin/keys` (@AdminBootstrap). Alternatives they might prefer: env-provisioned first key, or CLI command?
2. **Key storage shape**: we extended `api_keys` with a `scope` column (single resolver path). Would they rather see a dedicated `admin_api_keys` table?
3. **Dashboard auth for the keys UI**: server-side ai_admin key proxy vs widening owner-session bootstrap for key-management routes?
4. **v1.1 shipping shape**: follow-up commits on the same branch, or stacked PRs?

### Secondary asks
- Routing-write endpoints (v1.1): comfortable with ai_admin-scope keys writing tier config within the new tier model?
- Pause semantics: soft-disable at guard OK, or would they prefer revoked-with-grace?
- Would they want the keys-management dashboard section upstream now, or API-first?

---

## Part 6 — Context cheat-sheet (know before you go)

**Their world (from market research — full report: `docs/market-research-manifest.md`):**
- Paris-based; founders Bruno Pérez (CEO), Sébastien Conejo (CPO); Guillaume = founding engineer + most active committer. Berkeley SkyDeck + Inria backed; no public VC round found.
- ~7.5k stars (+2.5k in 3 months); GH Trending #3 Apr 2026; HN post 132 pts.
- Competitors: LiteLLM (57k stars, but March 2026 supply-chain attack = their biggest tailwind), Portkey (acquired by Palo Alto Networks), OpenRouter (self-declared rival), Bifrost (rising, star-parity).
- Monetization: cloud Free/$19 Pro/Enterprise; "no token markup"; Autofix healing service is their cloud dependency (even self-hosted installs can call it).
- Their moats: Autofix, agent-native per-harness keys, subscription providers (ChatGPT/Claude plans through the gateway).
- **Sept 1 (4 days post-meeting): rule-based router removal goes effective.** Expect them sensitive about anything that smells like "smart routing."

**Tone notes:**
- Small founder-led team, very responsive, technically opinionated. Guillaume reviews code personally (cubic bot + his review on #2747).
- Lead with data and working code, not vision slides. They deprecated their own feature on data.
- They reply to everything — expect follow-up async discussion regardless of meeting outcome.

---

## Fallback positions

| If they say… | We say… |
|---|---|
| "Too big a surface for one PR" | Split: key-type+guard first (M1), rest stacked. Already structured that way. |
| "Different table for admin keys" | Small migration refactor; we chose the column for least churn but it's not load-bearing. |
| "No dashboard UI yet" | Drop workstream A; keep B+C backend. UI lives in our fork regardless. |
| "Need Autofix-style cloud angle" | Open to discussing managed admin features on their cloud tier using our API design. |
| Silence/slow-walk | Branch stays pinned in our production; contribution remains available. Zero pressure. |
