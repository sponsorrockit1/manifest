---
title: "Manifest (mnfst) — Company, Market & Competitor Research"
date: 2026-08-25
author: "grok (Hermes Agent, ox-alpha)"
purpose: "Founder meeting prep — Guillaume Gay (@guillaumegay13), Thursday 2026-08-27 9am PST"
subject: mnfst
company: Manifest
maintainer: "@guillaumegay13 (Founding Engineer, most active committer)"
repo: "https://github.com/mnfst/manifest"
stars: 7476
license: MIT
hq: "Paris, France (LinkedIn); backed by Berkeley SkyDeck + Inria; legal entity UNVERIFIED"
funding: "No public VC round found (UNVERIFIED); accelerator backing only"
tags: [mnfst, manifest, llm-gateway, market-research, competitors, meeting-prep]
sources: 33
---

# Manifest (mnfst) — Market & Company Research Report

*Prepared for founder meeting with Guillaume Gay (@guillaumegay13), Thursday 2026-08-27*

---

## 1. Who is Manifest (mnfst)?

**What it is.** Manifest is an **open-source (MIT), self-hostable LLM gateway** for AI agents and apps — "LLM calls that don't break" / "AI Agents that don't break." It sits between an agent and its providers, exposes one OpenAI- **and** Anthropic-compatible endpoint, and handles routing tiers, automatic fallback across providers, per-request cost/token observability, hard spend limits, and its signature **Autofix** feature (auto-repairs failing 4xx requests via a hosted "healing service"). It connects 300+ models across ~30 built-in providers (OpenAI, Anthropic, Google, Mistral, DeepSeek, xAI, Qwen, OpenRouter, Ollama, LM Studio, llama.cpp, Groq, Cerebras, HF, NVIDIA NIM, and more), plus your own BYOK/custom endpoints and consumer subscriptions (Claude, ChatGPT, Gemini, etc.).

**Team & leadership.**
- **Bruno Pérez** — Co-founder & **CEO**, "Agents That Don't Break." **Paris, France** (per LinkedIn).
- **Sébastien Conejo** — Co-founder & **CPO**.
- **Guillaume Gay** — **Founding Engineer** (the maintainer you're meeting), France (École des Mines de Saint-Étienne). He is the **#2 committer** (857 commits) and currently the **most active contributor** — the latest repo commits are his.
- Commit mix: `brunobuddy` 3,607 commits (dominant), `guillaumegay13` 857, `SebConejo` 747, plus ~200+ commits authored by AI coding agents (`claude` 215) — a heavily AI-assisted, high-velocity OSS shop. **41 contributors total.**

**Company vs open-source project.** One entity drives both. The site's About page lists the two co-founders; the GitHub org `mnfst` is the product company. Legal HQ is **UNVERIFIED** — LinkedIn says Paris; some bios reference Berkeley, CA, and the homepage says **"Backed by Berkeley SkyDeck • Inria"** (a UC Berkeley accelerator + France's Inria), which reconciles the US/France signals.

**History / pivot (important).** The repo was created **2022-09-27** as a completely different product: an open-source **Backend-as-a-Service / headless CMS — "a whole backend that fits into 1 YAML file"** ("Effortless backends ✨" as of July 2024). Around the OpenClaw ecosystem's explosion (OpenClaw launched ~Dec 2025), they **pivoted the same repo/org into an LLM router/gateway** for agents, launched the router in **March 2026**, and have since rebranded to "LLM gateway." So this is a ~4-year-old org whose current product is ~1 year old.

**Funding.** **No public VC round found** for the LLM-gateway Manifest (marked UNVERIFIED — no Crunchbase/Press record for this company surfaced). The only institutional backing visible is the **Berkeley SkyDeck + Inria** logo on the homepage (likely accelerator/research support). Monetization is **product revenue**: a cloud tier on top of the free MIT core. ⚠️ *"Manifest" is a heavily overloaded name: Manifest OS (legal tech, $60M Series A at $750M valuation), Manifest (software/AI supply-chain security, ex-CISA CEO), and a real-estate "Manifest" are all unrelated companies — do not mix them up in diligence.*

---

## 2. Market reception & adoption signals

- **Stars: 7,476** (GitHub API, 2026-08-24), 501 forks, 5,979 commits, 119 open issues, 270 branches. Bruno posted that they "just hit 5,000 stars" ~3 months ago (≈May 2026) → **~2,500 stars in ~3 months — strong recent growth**.
- **Trending:** reached **GitHub Trending #3 on Apr 20, 2026**; Trendshift #10 repo-of-the-day (all languages, Apr 19, 2026); #25 TypeScript repo-of-the-week (Week 12, 2025).
- **Product Hunt:** launched **Mar 23, 2026** ("Manifest — Open Source LLM Router for OpenClaw") — **#19 on the daily leaderboard, ~31 upvotes** (modest, mid-pack debut).
- **Reddit:** multiple founder posts (r/MistralAI "I built Manifest…", r/ArtificialInteligence, r/SideProject) framing it as "an open-source alternative to OpenRouter" for OpenClaw.
- **Hacker News:** their contrarian post **"Everyone is building LLM routers, we deprecated ours" (Jul 31, 2026) hit 132 points / 87 comments** — the most notable HN signal; the thread was engaged and largely sympathetic (routing skeptics agreed; founder "brunaxLorax" responded at length).
- **Adoption anecdotes:** **Sanbox (sanbox.cloud) uses Manifest as its default LLM gateway**; a **Railway one-click deploy template** (created Jul 7, 2026); a **Cline feature request to add Manifest as a built-in provider** filed by a Manifest maintainer; independent write-ups exist (BetterStack guide, devhub.best, chatgate.ai).
- **Community:** Discord (invite linked everywhere), GitHub Discussions with a "Request a New AI Provider" upvote thread, 41 contributors, active daily commits (latest commit hours before this research ran). Discord member count: **UNVERIFIED** (not publicly scraped).
- **Content/positioning:** data-driven marketing — Guillaume's LinkedIn teases an analysis of **"16M errors in AI agent requests"**; the homepage cites "5% of LLM API calls fail in production" (Datadog) to sell Autofix.

**Net:** a well-liked, fast-growing OSS project in the hottest category of 2026, riding (a) the agent/harness wave and (b) a security vacuum left by LiteLLM's March 2026 supply-chain attack (see §3). Growth accelerated sharply in Apr–Aug 2026.

---

## 3. Top 3 true competitors (and how mnfst differentiates)

Reference stars (GitHub, 2026-08-24, via API): LiteLLM **57,173** · Portkey gateway **12,817** · Bifrost **7,544** · mnfst **7,476**.

### 3.1 LiteLLM (BerriAI) — the incumbent

The de-facto standard open-source LLM proxy (Python, created Jul 2023, ~57k stars).

Top 5 features: (1) **broadest provider coverage (~100+ providers)** behind one OpenAI-compatible API; (2) unified routing/load-balancing with retries & fallbacks; (3) per-key/team **spend budgets & tracking**; (4) **semantic caching**; (5) MCP gateway + enterprise proxy options (Docker/Helm/Terraform).

**⚠️ Market-defining event:** On **Mar 24, 2026**, threat actor "TeamPCP" compromised LiteLLM's PyPI publishing (via the Trivy supply-chain compromise) and shipped **backdoored versions 1.82.7/1.82.8** with a credential-harvesting `.pth` backdoor — called **"the largest AI supply chain breach of 2026," potentially exposing 2,500+ companies and 434,000 CI/CD pipelines** (CloudSEK; confirmed by PyPI incident report, Cycode, etc.). This is the single biggest category event and the **main tailwind behind Manifest's/Bifrost's recent traction** — teams are actively migrating off LiteLLM.

**vs mnfst:** LiteLLM = Python library/self-hosted plumbing, no agent-native concepts, no dashboard-first UX, no Autofix, and now a **trust liability**. Manifest is a typed TS monorepo (NestJS backend + SolidJS frontend), ships as a Docker image with a real dashboard, is agent/harness-native, and recently shipped a production-readiness security audit.

### 3.2 Portkey — enterprise gateway, now owned by Palo Alto Networks

Open-source gateway + hosted control plane; observability, guardrails, prompt management.

Top 5 features: (1) gateway to **250+ LLMs** with 1 API; (2) **advanced routing + retries/fallbacks**; (3) **observability/tracing + prompt management**; (4) semantic caching; (5) **enterprise governance** (RBAC, guardrails, budgets).

**Market-defining event:** **Palo Alto Networks acquired Portkey** (announced Apr 30, 2026; completed May 29, 2026 — a "$700M-class" bet) and is folding it into **Prisma AIRS** as the enterprise AI-security control plane. Portkey the OSS gateway still exists, but the company's center of gravity has moved to enterprise security under PANW.

**vs mnfst:** Portkey's control plane is **hosted** (data plane self-host option only for enterprise), so it's a weaker fit for the "self-hosted, data stays with you" buyer; its roadmap now follows a security vendor. Manifest is fully self-hostable MIT, agent-native, and no vendor lock-in.

### 3.3 OpenRouter — the hosted marketplace (Manifest's self-declared rival)

Manifest's own README contains a **"Manifest vs OpenRouter" comparison table** — this is the competitor they position against most directly.

Top 5 features: (1) **one API to 300+ models** across all labs; (2) model routing/benchmarks to pick the cheapest capable model; (3) **free-models tier**; (4) credit-based billing, zero infra; (5) huge community/ecosystem integrations.

**vs mnfst:** OpenRouter is **proprietary, hosted-only, charges ~5% on every call**, and all prompts/responses pass through a third party — no self-hosting, no BYOK, no subscription plans, no per-agent keys, limited per-team observability. Manifest counters on every axis: local/self-hosted, MIT, free, metadata-only telemetry (or fully local), bring-your-own providers, no token markup.

### Honorable mentions

**Bifrost (Maxim AI)** — Go, Apache-2.0, ~7.5k stars, claims ~50x faster P99 than LiteLLM, semantic cache, plugin system; the most direct "LiteLLM replacement" post-attack and at parity with Manifest on stars — watch it. Also: Kong AI Gateway, Cloudflare AI Gateway, Helicone, Requesty.

### mnfst differentiators vs all three

- **Self-hosted + MIT** (vs OpenRouter hosted/proprietary; vs Portkey's hosted control plane)
- **Agent-native keys — `mnfst_*` per harness (agent)**: every agent gets its own API key, its own routing tier, limits, fallback chain, and Autofix toggle — multi-agent cost isolation is a first-class concept, not an add-on.
- **Automatic fallback across providers**: per-tier chains up to **5 fallback models**, triggered by any HTTP ≥400 (except 424), with a 180s hung-provider timeout and `X-Manifest-Fallback-*` headers — agent keeps getting answers.
- **Free-tier routing**: an on-site **free-models catalog** (Aion, Cohere, Gemini free tiers, Mistral, Z.AI, Groq, HF, OpenRouter `:free`, OVHcloud, SiliconFlow…) you can wire into routing config without a credit card.
- **Usage observability**: per-request cost/token dashboards, **full request/response body logs**, spend alerts, per-harness hard limits that block before any provider call.
- **OpenAI- AND Anthropic-compatible proxy** (`/v1/chat/completions`, `/v1/responses`, `/v1/messages`).
- **Autofix is the genuine moat** — marketed as "the only LLM Gateway that autofixes bad requests on the fly"; competitors don't have an equivalent.
- **Subscription providers** (use your ChatGPT/Claude/Gemini/Copilot plans through the gateway) — unusual and hard to copy.

---

## 4. What else a founder should know before the meeting

**⚠️ The big one — they just publicly killed the "router" (and it's their identity now).**
- Mar 2026: launched rule-based LLM routing (classified requests into simple/standard/complex/reasoning).
- **Jun 22, 2026:** blog "We are deprecating our rule-based routing" — mixed results, system prompts from harnesses like OpenClaw/Hermes made everything look "complex," English-only rules, etc. **Removal effective Sept 1, 2026** (a week after your meeting); they map "standard"→"default" tier and push **custom tiers** via an `x-manifest-tier` header instead.
- **Jul 31, 2026:** "Everyone is building LLM routers, we deprecated ours" (the 132-point HN post) — 4 months, **7,000 cloud users**, conclusion: complexity can't be read from the prompt, **cache beats routing** (75–90% cheaper reads), routers break behavior consistency, unpredictability has hidden cost. Thesis: **"orchestrator > dumb router"** — engineers should pick models deliberately.

➡️ **Meeting implication:** anyone pitching "model routing" to them is arguing against their public, data-backed position. Align with the *gateway reliability* frame (fallback, autofix, observability, multi-agent cost control) instead. Note our Admin API v1.1 includes routing-write endpoints — frame these as *agent-managed tier configuration within their new tier model*, not as reintroducing rule-based routing.

**Roadmap signals (dashboard/UX + hardening).**
- Active **dashboard redesign**: closed issues/PRs include "Request-first analytics dashboard" (Jul 12, 2026), "add By Provider/By Model groupings to Overview Charts" (open), dashboard DB-load bounding (Aug 7, 2026), SWR caching, mobile layout, and a design-token styling hook merged Aug 5, 2026 — the frontend is being rebuilt/polished right now.
- "Production readiness audit — security fixes, CI, husky/lint-staged, env var docs" (Mar 2, 2026); expanding gateway API contract tests (Aug 10, 2026); Fly.io deployment templates with recordings persistence (Aug 7, 2026).
- Positioning shifts from "OpenClaw plugin" → "LLM gateway for agents & apps"; they court **Hermes** and **OpenClaw** users explicitly (repo topics include `hermes-agent` and `openclaw`; blog cites Hermes/OpenClaw harnesses).

**Monetization model (product-led, no VC pressure evident).**
- **Free $0**: Cloud (10k routed req/mo, 7-day retention) or self-hosted (unlimited, MIT); **Pro $19/mo**: unlimited, 365-day retention; **Enterprise**: on-prem/VPC, SSO/SAML, audit logs, SLA, HIPAA/BAAs.
- Explicit "**no token markup** — you bring your own keys, pay providers directly" (anti-OpenRouter stance).
- **Autofix is the cloud dependency**: even self-hosted installs call Manifest's **hosted healing service** for repairs (sends failed request + scrubbed error; keys never sent; one-shot retry before fallback; can be disabled). Privacy-minded enterprises may push back — a known surface to discuss.

**Community & culture.** Small, founder-led, extremely responsive (they reply to every HN comment), Discord-first support, "request a provider" voting via Discussions. Guillaume is the most active committer; Bruno is the public voice on HN/LinkedIn. Expect a technical, opinionated, AI-native engineering conversation.

**Key risks to probe.** (a) Category tailwind may be partly a LiteLLM-trust aftershock — is it durable? (b) OpenClaw-tied origin story vs broad "agents & apps" ambition; (c) tiny team (~2-3 core) carrying a very fast-moving OSS project; (d) autofix data/cloud dependency vs pure self-host promise; (e) crowded market (LiteLLM, Bifrost, Kong, Cloudflare, Requesty, Helicone all competing).

---

## Sources

[1] https://manifest.build/about — Manifest About page
[2] https://trendshift.io/repositories/12890 — Trendshift mnfst/manifest
[3] https://github.com/mnfst/manifest/discussions — Manifest GitHub discussions
[4] https://huggingface.co/mnfst — HuggingFace mnfst org
[5] https://manifest.build/blog/why-we-deprecated-our-llm-router — Manifest blog: why we deprecated our LLM router
[6] https://manifest.build/pricing — Manifest pricing
[7] https://github.com/cline/cline/discussions/12093 — Cline discussion: add Manifest as built-in provider
[8] https://manifest.build/blog/deprecating-rule-based-routing — Manifest blog: deprecating rule-based routing
[9] https://manifest.build/docs/llm-gateway — Manifest LLM gateway docs
[10] https://manifest.build/docs/autofix — Manifest Autofix docs
[11] https://manifest.build/docs/introduction — Manifest docs introduction
[12] https://www.reddit.com/r/SideProject/comments/1s1kep5/i_will_not_promote_we_just_launched_manifest_on — Reddit r/SideProject PH launch
[13] https://www.producthunt.com/leaderboard/daily/2026/3/23/all — Product Hunt daily leaderboard 2026-03-23
[14] https://www.linkedin.com/in/bruno-p%C3%A9rez — Bruno Pérez LinkedIn
[15] https://fr.linkedin.com/in/guillaume-gay-aa0ba6133 — Guillaume Gay LinkedIn
[16] https://www.linkedin.com/in/sebastien-conejo — Sébastien Conejo LinkedIn
[17] https://news.ycombinator.com/item?id=49126630 — HN thread: Everyone is building LLM routers
[18] https://cycode.com/blog/lite-llm-supply-chain-attack — Cycode: LiteLLM supply chain attack
[19] https://blog.pypi.org/posts/2026-04-02-incident-report-litellm-telnyx-supply-chain-attack — PyPI incident report LiteLLM/Telnyx
[20] https://www.cloudsek.com/blog/ai-supply-chain-breach-2500-companies-434000-cicd-pipelines — CloudSEK LiteLLM exposure analysis
[21] https://www.paloaltonetworks.com/company/press/2026/palo-alto-networks-completes-acquisition-of-portkey-to-secure-ai-agents — PANW completes Portkey acquisition
[22] https://thenewstack.io/palo-alto-portkey-ai-gateway — TheNewStack: PANW $700M-class bet on Portkey
[23] https://dev.to/sebconejo/i-built-an-open-source-alternative-to-openrouter-that-runs-on-your-machine-for-your-openclaw-25jg — dev.to Sébastien: alternative to OpenRouter
[24] https://www.producthunt.com/posts/manifest-361 — Product Hunt: Manifest 361
[25] https://huggingface.co/spaces/mnfst/README — HuggingFace mnfst README space
[26] https://www.reddit.com/r/programming/comments/1hcv9oz/manifest_a_whole_backend_that_fits_into_1_yaml — Reddit r/programming: Manifest whole backend in 1 YAML
[27] https://jamstack.org/headless-cms/manifest — Jamstack: Manifest headless CMS
[28] https://www.linkedin.com/posts/bruno-p%C3%A9rez_manifest-just-launched-auto-fix-activity-7488166678040563712-HVXN — Bruno Pérez: Autofix beta + 5000 stars
[29] https://github.com/mnfst/manifest — mnfst/manifest GitHub repo
[30] https://manifest.build — Manifest homepage
[31] https://www.linkedin.com/posts/bruno-p%C3%A9rez_sanbox-uses-manifest-as-default-llm-gateway-activity-7485408391457193984-Kr2F — Bruno Pérez: Sanbox uses Manifest
[32] https://manifest.build/free-models — Manifest free models catalog
[33] https://railway.com/deploy/manifest--wild-wild — Railway deploy template for Manifest

*(Repo stats cited from GitHub API queries of each repo; competitor comparisons from OpenZiti, Contabo, PkgPulse, api7, Requesty comparisons surfaced in search. HQ legal entity and funding amounts remain UNVERIFIED.)*
