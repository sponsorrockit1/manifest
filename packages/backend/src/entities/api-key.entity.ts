import { Column, Entity, PrimaryColumn, Index } from 'typeorm';
import { timestampType, timestampDefault } from '../common/utils/postgres-sql';

@Entity('api_keys')
export class ApiKey {
  @PrimaryColumn('varchar')
  id!: string;

  @Column('varchar', { nullable: true })
  key!: string | null;

  @Index({ unique: true })
  @Column('varchar', { length: 128 })
  key_hash!: string;

  @Column('varchar', { length: 12 })
  key_prefix!: string;

  /**
   * Last 4 chars of the raw key (v1.1). Captured once at mint/rotate so the
   * UI can display `prefix…last4` without storing the secret. NULL for keys
   * minted before this column existed (legacy rows render as "—" in the UI).
   */
  @Column('varchar', { length: 4, nullable: true })
  key_last4!: string | null;

  @Column('varchar')
  @Index()
  tenant_id!: string;

  /** Audit-only: which user created the key. Never used for scoping. */
  @Column('varchar', { nullable: true })
  created_by_user_id!: string | null;

  @Column('varchar')
  name!: string;

  /**
   * Authorization scope for the key. `owner` (default) authorizes the full
   * `/api/v1/*` surface via ApiKeyGuard; `ai_admin` authorizes only the
   * scoped `/api/v1/admin` surface via AdminAiGuard. Additive: existing
   * owner keys retain `owner` and resolve exactly as before.
   */
  @Column('varchar', { default: 'owner' })
  scope!: string;

  /**
   * v1.1 soft-disable: when set, the key is rejected by AdminAiGuard with
   * 403 `key_paused` on all /api/v1/admin routes except the exempted resume
   * route (@AllowPausedKey). Operational switch only — NOT a security
   * boundary (an ai_admin holder can mint spares; see plan §D.4).
   */
  @Column(timestampType(), { nullable: true, default: null })
  paused_at!: string | null;

  @Column(timestampType(), { default: timestampDefault() })
  created_at!: string;

  @Column(timestampType(), { nullable: true, default: null })
  last_used_at!: string | null;
}
