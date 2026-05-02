import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class PermissionsCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async invalidateEffectivePermissions(businessId: string, roleId: string): Promise<void> {
    const cacheKey = `effective_permissions_${businessId}_${roleId}`;

    await this.cacheManager.del(cacheKey);
  }

  async invalidateRolePermissions(_roleId: string): Promise<void> {
    await this.cacheManager.clear();
  }

  async invalidateAllRolePermissions(): Promise<void> {
    await this.cacheManager.clear();
  }
}
