import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { CanActivate, ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { Reflector } from "@nestjs/core";

import { PERMISSIONS_KEY } from "@auth/decorators/required-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private dataSource: DataSource,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metadata = this.reflector.getAllAndOverride(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!metadata) {
      return true;
    }

    const { permissions, mode } = metadata;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.roleId) {
      throw new HttpException("No tienes permisos para acceder a este recurso", HttpStatus.FORBIDDEN);
    }

    if (user.isSuperAdmin) return true;

    if (!user.businessId) {
      throw new HttpException("No tienes permisos para acceder a este recurso", HttpStatus.FORBIDDEN);
    }

    const userPermissions = await this.getEffectivePermissions(user.businessId, user.roleId);

    if (!userPermissions || userPermissions.length === 0) {
      throw new HttpException("Tu rol no posee permisos asignados", HttpStatus.FORBIDDEN);
    }

    let hasPermissions: boolean;
    if (mode === "some") {
      hasPermissions = permissions.some((permission: string) => userPermissions.includes(permission));
    } else {
      hasPermissions = permissions.every((permission: string) => userPermissions.includes(permission));
    }

    if (!hasPermissions) {
      throw new HttpException(
        `El usuario no posee los permisos necesarios: ${permissions.join(", ")}`,
        HttpStatus.FORBIDDEN,
      );
    }

    return hasPermissions;
  }

  private async getEffectivePermissions(businessId: string, roleId: string): Promise<string[]> {
    const cacheKey = `effective_permissions_${businessId}_${roleId}`;

    let permissions: string[] = (await this.cacheManager.get(cacheKey)) as string[];

    if (!permissions) {
      const rows: { action_key: string }[] = await this.dataSource.query(
        `
          SELECT p.action_key
          FROM permission p
          LEFT JOIN role_permissions rp
            ON rp.permission_id = p.id AND rp.role_id = $2
          LEFT JOIN business_role_permissions brp
            ON brp.permission_id = p.id AND brp.role_id = $2 AND brp.business_id = $1
          WHERE p.deleted_at IS NULL
            AND (
              brp.effect = 'grant'
              OR (
                rp.role_id IS NOT NULL
                AND (brp.effect IS NULL OR brp.effect <> 'deny')
              )
            )
        `,
        [businessId, roleId],
      );

      permissions = rows.map((r) => r.action_key);
      await this.cacheManager.set(cacheKey, permissions);
    }

    return permissions;
  }
}
