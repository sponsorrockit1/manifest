import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * v1.1: extracts the authenticated key row id stashed by ApiKeyGuard.
 * Used by the pause endpoint to enforce the self-pause guard (a key must
 * not be able to pause itself).
 */
export const ReqApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ apiKeyId?: string }>();
    return request.apiKeyId;
  },
);
