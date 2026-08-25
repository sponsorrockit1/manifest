---
'manifest': minor
---

Admin API v1.1: key management (rotate/pause/resume + last4 display), per-agent routing write on the admin surface

- `api_keys` gains `key_last4` (display identity for the keys UI) and `paused_at`
  (operational soft-disable enforced by AdminAiGuard; resume route exempted via
  @AllowPausedKey so a paused key can un-pause itself).
- New admin endpoints: `POST /admin/keys/:id/rotate` (in-place re-key, raw shown once),
  `POST /admin/keys/:id/pause`, `POST /admin/keys/:id/resume`. Self-pause is forbidden
  (`self_management_forbidden`).
- New `GET/PUT /admin/agents/:agentName/routing/tiers[...]`, `PUT .../fallbacks`,
  `POST .../reset-all` — thin twin of the dashboard tier controller with identical
  tenant scoping and tier validation, letting ai_admin agents manage their own routing.
