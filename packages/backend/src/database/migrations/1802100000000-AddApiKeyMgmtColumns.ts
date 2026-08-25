import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * v1.1 key-management support: adds `key_last4` (display identity for the
 * dashboard keys UI — prefix is identical across admin keys) and `paused_at`
 * (soft-disable switch enforced by AdminAiGuard; NOT a security boundary —
 * see plan §D.4). Both nullable; existing rows keep working unchanged.
 */
export class AddApiKeyMgmtColumns1802100000000 implements MigrationInterface {
  name = 'AddApiKeyMgmtColumns1802100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`SET LOCAL lock_timeout = '5s'`);
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "key_last4" varchar(4)`,
    );
    await queryRunner.query(
      `ALTER TABLE "api_keys" ADD COLUMN IF NOT EXISTS "paused_at" timestamp(3)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Session-scoped lock_timeout: migration:revert may run with --transaction
    // none where SET LOCAL would not stay scoped. Same pattern as AddApiKeyScope.
    await queryRunner.query(`SET lock_timeout = '5s'`);
    await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "key_last4"`);
    await queryRunner.query(`ALTER TABLE "api_keys" DROP COLUMN IF EXISTS "paused_at"`);
    await queryRunner.query(`RESET lock_timeout`);
  }
}
