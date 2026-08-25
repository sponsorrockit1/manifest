import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ApiKey } from '../../entities/api-key.entity';
import { Tenant } from '../../entities/tenant.entity';
import { hashKey, keyPrefix } from '../../common/utils/hash.util';
import { ADMIN_AI_KEY_PREFIX, ADMIN_KEY_SCOPE } from '../../common/constants/admin-key.constants';

/**
 * Mints and resolves AI-admin keys (`mnfst_admin_ai_*`). These are `ApiKey`
 * rows with `scope = 'ai_admin'`, resolved through the existing ApiKeyGuard
 * (so they populate `tenantContext` exactly like owner keys) and further
 * restricted to the `/api/v1/admin` surface by AdminAiGuard.
 *
 * Reuses the same hashing/prefixing primitives as harness keys — only the
 * scope column and prefix differ. It never returns the stored secret after
 * insert except in the immediate create/rotate response.
 *
 * v1.1: adds rotate (in-place; preserves id/name/created_at), pause/resume
 * (operational soft-disable via paused_at), and last4 capture for UI display.
 */
@Injectable()
export class AdminKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepo: Repository<ApiKey>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private generateKey(): string {
    return ADMIN_AI_KEY_PREFIX + randomBytes(32).toString('base64url');
  }

  private static last4(rawKey: string): string | null {
    // Defensive: keys are long and fixed-shape today, but never trust that.
    return rawKey.length >= 4 ? rawKey.slice(-4) : null;
  }

  /**
   * Mint a new AI-admin key bound to a tenant. Self-hosted bootstrapping: an
   * operator supplies `tenantId` (or it is resolved from the caller's session
   * tenant context upstream). Tenant must already exist.
   */
  async createAdminKey(params: {
    tenantId: string;
    name?: string;
    createdByUserId?: string | null;
  }): Promise<{ id: string; key: string; keyPrefix: string }> {
    const tenant = await this.tenantRepo.findOne({ where: { id: params.tenantId } });
    if (!tenant) throw new NotFoundException(`Tenant ${params.tenantId} not found`);

    const rawKey = this.generateKey();
    const id = uuidv4();
    await this.apiKeyRepo.insert({
      id,
      // Hash-only storage: `key` stays NULL exactly like every other key minted
      // after the HashApiKeys migration removed plaintext from this column.
      // The guard authorizes via the salt-aware `key_hash`; the raw secret is
      // returned once below and never persisted.
      key: null,
      key_hash: hashKey(rawKey),
      key_prefix: keyPrefix(rawKey),
      key_last4: AdminKeyService.last4(rawKey),
      tenant_id: params.tenantId,
      created_by_user_id: params.createdByUserId ?? null,
      name: params.name ?? `ai-admin-${id.slice(0, 8)}`,
      scope: ADMIN_KEY_SCOPE,
    });

    // Return the raw key exactly once (caller stores it). Subsequent reads
    // return only keyPrefix (+last4 for display).
    return { id, key: rawKey, keyPrefix: keyPrefix(rawKey) };
  }

  /** List admin keys for a tenant (prefix + last4 + metadata only, never the secret). */
  async listAdminKeys(
    tenantId: string,
  ): Promise<
    Array<{
      id: string;
      keyPrefix: string;
      keyLast4: string | null;
      name: string;
      createdAt: string;
      pausedAt: string | null;
      lastUsedAt: string | null;
    }>
  > {
    const rows = await this.apiKeyRepo.find({
      where: { tenant_id: tenantId, scope: ADMIN_KEY_SCOPE },
      select: ['id', 'key_prefix', 'key_last4', 'name', 'created_at', 'paused_at', 'last_used_at'],
    });
    return rows.map((r) => ({
      id: r.id,
      keyPrefix: r.key_prefix,
      keyLast4: r.key_last4 ?? null,
      name: r.name,
      createdAt: r.created_at,
      pausedAt: r.paused_at ?? null,
      lastUsedAt: r.last_used_at ?? null,
    }));
  }

  async revokeAdminKey(tenantId: string, id: string): Promise<void> {
    await this.apiKeyRepo.delete({ id, tenant_id: tenantId, scope: ADMIN_KEY_SCOPE });
  }

  /**
   * v1.1 rotate: in-place re-key. Preserves id, name, scope, created_at,
   * created_by_user_id (audit continuity); replaces key_hash/prefix/last4 and
   * clears any pause. Old raw key stops working immediately (hash replaced).
   * Raw new key returned exactly once.
   */
  async rotateAdminKey(
    tenantId: string,
    id: string,
  ): Promise<{ id: string; key: string; keyPrefix: string }> {
    const row = await this.apiKeyRepo.findOne({
      where: { id, tenant_id: tenantId, scope: ADMIN_KEY_SCOPE },
    });
    if (!row) throw new NotFoundException(`Admin key ${id} not found`);

    const rawKey = this.generateKey();
    await this.apiKeyRepo.update(
      { id },
      {
        key_hash: hashKey(rawKey),
        key_prefix: keyPrefix(rawKey),
        key_last4: AdminKeyService.last4(rawKey),
        paused_at: null,
        last_used_at: null,
      },
    );
    return { id, key: rawKey, keyPrefix: keyPrefix(rawKey) };
  }

  /**
   * v1.1 pause: operational soft-disable. Sets paused_at; AdminAiGuard then
   * rejects the key on all admin routes except the exempted resume route.
   * Self-pause is forbidden upstream in the controller (a key must not be
   * able to lock out its own management path).
   */
  async pauseAdminKey(tenantId: string, id: string, requestingApiKeyId?: string): Promise<void> {
    if (requestingApiKeyId && requestingApiKeyId === id) {
      throw new ForbiddenException({
        message: 'A key cannot pause itself.',
        code: 'self_management_forbidden',
      });
    }
    const result = await this.apiKeyRepo.update(
      { id, tenant_id: tenantId, scope: ADMIN_KEY_SCOPE },
      { paused_at: () => 'COALESCE(paused_at, NOW())' },
    );
    if (!result.affected) throw new NotFoundException(`Admin key ${id} not found`);
  }

  /** v1.1 resume: clears paused_at. Reachable by a paused key (@AllowPausedKey route). */
  async resumeAdminKey(tenantId: string, id: string): Promise<void> {
    const result = await this.apiKeyRepo.update(
      { id, tenant_id: tenantId, scope: ADMIN_KEY_SCOPE },
      { paused_at: null },
    );
    if (!result.affected) throw new NotFoundException(`Admin key ${id} not found`);
  }
}
