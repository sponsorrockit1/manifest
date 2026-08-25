import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { ApiKey } from '../../entities/api-key.entity';
import { AdminAiGuard } from './admin-ai.guard';
import { ADMIN_BOOTSTRAP_KEY } from '../decorators/admin-bootstrap.decorator';

type MetadataReader = { getAllAndOverride: (key: symbol | string) => unknown };

function makeContext(
  authScope?: string,
  metadata?: Partial<Record<symbol | string, unknown>>,
): ExecutionContext {
  const request: Record<string, unknown> = {};
  if (authScope !== undefined) request.authScope = authScope;
  const reflector = {
    getAllAndOverride: (key: symbol | string) => (metadata ? metadata[key] : undefined),
  } as unknown as Reflector;
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => ({}),
    getClass: () => ({}),
    reflector,
  } as unknown as ExecutionContext;
}

describe('AdminAiGuard', () => {
  const stubRepo = {
  findOne: async () => null,
} as unknown as Repository<ApiKey>;
const noBootstrap: Partial<Record<symbol | string, unknown>> = {
    [ADMIN_BOOTSTRAP_KEY]: false,
  };

  it('allows requests whose resolved scope is ai_admin', async () => {
    const guard = new AdminAiGuard(new Reflector(), stubRepo);
    await expect(guard.canActivate(makeContext('ai_admin'))).resolves.toBe(true);
  });

  it('throws ForbiddenException for an owner (non-admin) key on regular routes', async () => {
    const guard = new AdminAiGuard(new Reflector(), stubRepo);
    await expect(guard.canActivate(makeContext('owner'))).rejects.toThrow(ForbiddenException);
    await expect(guard.canActivate(makeContext('owner'))).rejects.toThrow(
      'not authorized for the admin surface',
    );
  });

  it('throws UnauthorizedException when no key scope was resolved', async () => {
    const guard = new AdminAiGuard(new Reflector(), stubRepo);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow('requires an AI-admin key');
  });

  it('admits an owner key only on @AdminBootstrap() routes', async () => {
    const bootstrapMeta: Partial<Record<symbol | string, unknown>> = {
      [ADMIN_BOOTSTRAP_KEY]: true,
    };
    // Route-level metadata wins over class-level absence.
    const guard = new AdminAiGuard({
      getAllAndOverride: (_key: symbol | string, _handlers?: unknown) =>
        bootstrapMeta[ADMIN_BOOTSTRAP_KEY],
    } as unknown as Reflector, stubRepo);
    await expect(guard.canActivate(makeContext('owner'))).resolves.toBe(true);

    // Without the flag the same owner key stays forbidden.
    const plainGuard = new AdminAiGuard(new Reflector(), stubRepo);
    await expect(plainGuard.canActivate(makeContext('owner'))).rejects.toThrow(ForbiddenException);
  });
});
