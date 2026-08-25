import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TenantCtx, TenantContext } from '../../common/decorators/tenant-context.decorator';
import { AdminAiGuard } from '../guards/admin-ai.guard';
import { ResolveAgentService } from '../../routing/routing-core/resolve-agent.service';
import { TierService } from '../../routing/routing-core/tier.service';
import {
  AgentNameParamDto,
  SetOverrideDto,
} from '../../routing/dto/routing.dto';
import { TIER_SLOTS } from 'manifest-shared';

/**
 * v1.1 (workstream C): per-agent routing/fallback *write* behind the admin
 * surface — the former M5. Thin twin of the dashboard's tier.controller:
 * identical tenant scoping (ResolveAgentService.resolve(tenantId, agentName)),
 * identical DTO validation and tier whitelist. No new routing logic.
 */
@Controller('api/v1/admin/agents/:agentName/routing')
@UseGuards(AdminAiGuard)
export class AdminRoutingController {
  constructor(
    private readonly tierService: TierService,
    private readonly resolveAgentService: ResolveAgentService,
  ) {}

  @Get('tiers')
  async getTiers(@TenantCtx() ctx: TenantContext, @Param() params: AgentNameParamDto) {
    const agent = await this.resolveAgentService.resolve(ctx.tenantId, params.agentName);
    return this.tierService.getTiers(agent.id, agent.tenant_id);
  }

  @Put('tiers/:tier')
  async setOverride(
    @TenantCtx() ctx: TenantContext,
    @Param('agentName') agentName: string,
    @Param('tier') tier: string,
    @Body() body: SetOverrideDto,
  ) {
    this.validateTier(tier);
    // Tenant-scoped resolution — never forward a bare agentName across tenants.
    const agent = await this.resolveAgentService.resolve(ctx.tenantId, agentName);
    // Prefer the structured route when sent, else flat fields — identical to
    // the dashboard twin (tier.controller.ts).
    const model = body.route?.model ?? body.model;
    const provider = body.route?.provider ?? body.provider;
    const authType = body.route?.authType ?? body.authType;
    const providerKeyLabel = body.route?.keyLabel ?? body.providerKeyLabel;
    return this.tierService.setOverride(
      agent.id,
      agent.tenant_id,
      tier,
      model,
      provider,
      authType,
      providerKeyLabel,
    );
  }

  @Put('tiers/:tier/fallbacks')
  async setFallbacks(
    @TenantCtx() ctx: TenantContext,
    @Param('agentName') agentName: string,
    @Param('tier') tier: string,
    @Body() body: SetOverrideDto[],
  ) {
    this.validateTier(tier);
    const agent = await this.resolveAgentService.resolve(ctx.tenantId, agentName);
    const models = body.map((b) => b.model);
    const routes = body.some((b) => b.route)
      ? (body.map((b) => b.route).filter(Boolean) as NonNullable<SetOverrideDto['route']>[])
      : undefined;
    return this.tierService.setFallbacks(agent.id, agent.tenant_id, tier, models, routes);
  }

  @Post('reset-all')
  async resetAllOverrides(@TenantCtx() ctx: TenantContext, @Param() params: AgentNameParamDto) {
    const agent = await this.resolveAgentService.resolve(ctx.tenantId, params.agentName);
    await this.tierService.resetAllOverrides(agent.id);
    return { reset: true };
  }

  private validateTier(tier: string): void {
    if (!(TIER_SLOTS as readonly string[]).includes(tier)) {
      throw new BadRequestException(
        `Invalid tier: ${tier}. Must be one of: ${TIER_SLOTS.join(', ')}`,
      );
    }
  }
}
