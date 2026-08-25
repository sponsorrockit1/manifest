import { SetMetadata } from '@nestjs/common';

/**
 * v1.1: marks a route as reachable by a *paused* ai_admin key. Only the
 * resume endpoint carries this — a paused key must be able to authenticate
 * (hash match succeeds in ApiKeyGuard) and reach exactly one route: its own
 * un-pause. Without the exemption the guard would 403 the paused key before
 * any handler ran, making pause a permanent lockout.
 *
 * The paused-key check itself lives in AdminAiGuard; this decorator only
 * opts a route out of that check.
 */
export const ALLOW_PAUSED_KEY = 'allowPausedKey';
export const AllowPausedKey = () => SetMetadata(ALLOW_PAUSED_KEY, true);
