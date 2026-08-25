import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { ApiKey } from '../../entities/api-key.entity';
import { ADMIN_KEY_SCOPE } from '../../common/constants/admin-key.constants';
import { ADMIN_BOOTSTRAP_KEY } from '../decorators/admin-bootstrap.decorator';
import { ALLOW_PAUSED_KEY } from '../decorators/allow-paused-key.decorator';

/**
 * Restricts the `/api/v1/admin` surface to keys carrying `scope = 'ai_admin'`.
 *
 * Primary authentication is performed upstream by the global ApiKeyGuard, which
 * resolves the `api_keys` row, populates `tenantContext`, and stashes the
 * resolved `authScope` on the request. This guard only checks that scope.
 *
 * Exceptions:
 * - Routes marked `@AdminBootstrap()` additionally accept owner keys
 *   (`scope = 'owner'`) so a fresh install can mint its first admin key.
 * - v1.1: keys with `paused_at` set are rejected (403 `key_paused`) on every
 *   route EXCEPT those marked `@AllowPausedKey()` — without that exemption a
 *   paused key could never reach its own resume endpoint. The exemption is
 *   applied only to resume; pause is an operational switch, not a security
 *   boundary (plan §D.4).
 */
@Injectable()
export class AdminAiGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    // Real TypeORM repo token — NestJS DI resolves via design:paramtypes, so
    // this MUST be a class type (Repository<ApiKey>), not a structural literal.
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { authScope?: string; tenantContext?: { tenantId: string }; apiKeyId?: string }
    >();
    const resolvedScope = request.authScope;

    if (resolvedScope === ADMIN_KEY_SCOPE) {
      return this.checkPaused(context, request);
    }

    const bootstrapAllowed = this.readFlag(ADMIN_BOOTSTRAP_KEY, context);
    if (bootstrapAllowed && resolvedScope === 'owner') return true;

    if (typeof resolvedScope === 'string') {
      // Authenticated via some other key (e.g. an owner key) but lacking the
      // admin scope.
      throw new ForbiddenException('This key is not authorized for the admin surface.');
    }

    // No api-key resolution at all → 401, same contract as other tenant-gated
    // endpoints.
    throw new UnauthorizedException('This endpoint requires an AI-admin key (mnfst_admin_ai_*).');
  }

  private readFlag(key: string, context: ExecutionContext): boolean {
    return this.reflector.getAllAndOverride<boolean>(key, [
      context.getHandler(),
      context.getClass(),
    ]);
  }

  /**
   * Paused-key enforcement for ai_admin keys. ApiKeyGuard stashes nothing
   * about the key row beyond scope/tenant, so we look up paused_at directly.
   * Cheap: primary-key lookup, only on the admin surface.
   */
  private async checkPaused(
    context: ExecutionContext,
    request: Request & { tenantContext?: { tenantId: string }; apiKeyId?: string },
  ): Promise<boolean> {
    const allowPaused = this.readFlag(ALLOW_PAUSED_KEY, context);
    const keyId = request.apiKeyId;
    const tenantId = request.tenantContext?.tenantId;

    if (keyId && tenantId) {
      const row = await this.apiKeyRepo.findOne({
        where: { id: keyId, tenant_id: tenantId, scope: ADMIN_KEY_SCOPE },
        select: ['id', 'paused_at'],
      });
      if (row?.paused_at && !allowPaused) {
        throw new ForbiddenException({
          message: 'This key is paused.',
          code: 'key_paused',
        });
      }
    }
    return true;
  }
}
