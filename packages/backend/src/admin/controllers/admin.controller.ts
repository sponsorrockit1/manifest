import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { TenantCtx, TenantContext } from '../../common/decorators/tenant-context.decorator';
import { AdminAiGuard } from '../guards/admin-ai.guard';
import { AdminBootstrap } from '../decorators/admin-bootstrap.decorator';
import { AllowPausedKey } from '../decorators/allow-paused-key.decorator';
import { ReqApiKey } from '../decorators/req-api-key.decorator';
import { AdminKeyService } from '../services/admin-key.service';

class CreateAdminKeyDto {
  @IsOptional()
  @IsString()
  name?: string;
}

/**
 * Scoped AI-administration surface (`/api/v1/admin`). Every route is gated by
 * AdminAiGuard, which requires a key with `scope = 'ai_admin'`. The handlers
 * reuse existing services; this controller only adds the key-management
 * operations that bootstrap and govern admin access itself.
 *
 * No handler returns a stored provider/harness secret. Key minting returns the
 * raw key exactly once at creation time.
 *
 * Bootstrap: `POST /keys` also accepts an owner key so a fresh self-hosted
 * install can mint its first `ai_admin` key (see AdminBootstrap).
 */
@Controller('api/v1/admin')
@UseGuards(AdminAiGuard)
export class AdminController {
  constructor(private readonly adminKeyService: AdminKeyService) {}

  @Post('keys')
  @AdminBootstrap()
  async createKey(@TenantCtx() ctx: TenantContext, @Body() body: CreateAdminKeyDto) {
    if (!ctx.tenantId) {
      throw new ForbiddenException('Admin key creation requires a resolved tenant.');
    }
    const { id, key, keyPrefix } = await this.adminKeyService.createAdminKey({
      tenantId: ctx.tenantId,
      name: body?.name,
      createdByUserId: ctx.userId,
    });
    // Raw key returned exactly once.
    return { id, key, keyPrefix };
  }

  @Get('keys')
  async listKeys(@TenantCtx() ctx: TenantContext) {
    if (!ctx.tenantId) return { keys: [] };
    const keys = await this.adminKeyService.listAdminKeys(ctx.tenantId);
    return { keys };
  }

  @Delete('keys/:id')
  async revokeKey(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    if (!ctx.tenantId) return { revoked: false };
    await this.adminKeyService.revokeAdminKey(ctx.tenantId, id);
    return { revoked: true };
  }

  /**
   * v1.1 rotate: in-place re-key; old raw key invalidated immediately (hash
   * replaced). New raw key returned exactly once.
   */
  @Post('keys/:id/rotate')
  async rotateKey(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    if (!ctx.tenantId) {
      throw new ForbiddenException('Admin key rotation requires a resolved tenant.');
    }
    const { id: keyId, key, keyPrefix } = await this.adminKeyService.rotateAdminKey(
      ctx.tenantId,
      id,
    );
    return { id: keyId, key, keyPrefix };
  }

  /**
   * v1.1 pause: operational soft-disable. Self-pause forbidden — a key must
   * not be able to lock out its own management path.
   */
  @Post('keys/:id/pause')
  async pauseKey(
    @TenantCtx() ctx: TenantContext,
    @Param('id') id: string,
    @ReqApiKey() apiKeyId?: string,
  ) {
    if (!ctx.tenantId) return { paused: false };
    await this.adminKeyService.pauseAdminKey(ctx.tenantId, id, apiKeyId);
    return { paused: true };
  }

  /**
   * v1.1 resume: clears paused_at. The ONLY route a paused key can reach
   * (@AllowPausedKey exempts it from the guard's paused rejection).
   */
  @Post('keys/:id/resume')
  @AllowPausedKey()
  async resumeKey(@TenantCtx() ctx: TenantContext, @Param('id') id: string) {
    if (!ctx.tenantId) return { resumed: false };
    await this.adminKeyService.resumeAdminKey(ctx.tenantId, id);
    return { resumed: true };
  }

  @Get('health')
  health() {
    return { status: 'ok', surface: 'admin' };
  }
}
