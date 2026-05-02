import { DataSource } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import {
  BusinessRolePermission,
  EPermissionEffect,
} from "@business-role-permissions/entities/business-role-permission.entity";
import { EffectivePermissionDto } from "./dto/effective-permission.dto";
import { OverrideDto } from "@business-role-permissions/dto/override.dto";
import { PermissionsCacheService } from "@permissions/permissions-cache.service";
import { UpsertOverrideDto } from "@business-role-permissions/dto/upsert-override.dto";

interface EffectiveRow {
  id: string;
  name: string;
  category: string;
  action_key: string;
  description: string;
  in_baseline: boolean;
  override_effect: EPermissionEffect | null;
  is_effective: boolean;
}

interface OverrideRow {
  business_id: string;
  role_id: string;
  permission_id: string;
  effect: EPermissionEffect;
  action_key: string;
  name: string;
  category: string;
}

@Injectable()
export class BusinessRolePermissionsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly permissionsCacheService: PermissionsCacheService,
  ) {}

  async upsert(businessId: string, roleId: string, permissionId: string, upsertDto: UpsertOverrideDto) {
    const result = await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(BusinessRolePermission)
      .values({
        businessId,
        roleId,
        permissionId,
        effect: upsertDto.effect,
      })
      .orUpdate(["effect", "updated_at"], ["business_id", "role_id", "permission_id"])
      .returning("*")
      .execute();

    if (!result) throw new HttpException("Error al guardar override", HttpStatus.INTERNAL_SERVER_ERROR);

    await this.permissionsCacheService.invalidateEffectivePermissions(businessId, roleId);

    return ApiResponse.success<BusinessRolePermission>("Override guardado", result.raw[0]);
  }

  async listEffective(businessId: string, roleId: string) {
    const rows: EffectiveRow[] = await this.dataSource.query(
      `
        SELECT
          p.id,
          p.name,
          p.category,
          p.action_key,
          p.description,
          COALESCE(rp.role_id IS NOT NULL, false)::boolean AS in_baseline,
          brp.effect AS override_effect,
          COALESCE(
            brp.effect = 'grant'
            OR (
              rp.role_id IS NOT NULL
              AND (brp.effect IS NULL OR brp.effect <> 'deny')
            ),
            false
          )::boolean AS is_effective
        FROM permission p
        LEFT JOIN role_permissions rp
          ON rp.permission_id = p.id AND rp.role_id = $2
        LEFT JOIN business_role_permissions brp
          ON brp.permission_id = p.id AND brp.role_id = $2 AND brp.business_id = $1
        WHERE p.deleted_at IS NULL
        ORDER BY p.category ASC, p.action_key ASC
      `,
      [businessId, roleId],
    );

    const data: EffectivePermissionDto[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      actionKey: r.action_key,
      description: r.description,
      inBaseline: r.in_baseline,
      overrideEffect: r.override_effect,
      isEffective: r.is_effective,
    }));

    return ApiResponse.success<EffectivePermissionDto[]>("Permisos efectivos", data);
  }

  async listOverrides(businessId: string, roleId: string) {
    const rows: OverrideRow[] = await this.dataSource.query(
      `
        SELECT
          brp.business_id,
          brp.role_id,
          brp.permission_id,
          brp.effect,
          p.action_key,
          p.name,
          p.category
        FROM business_role_permissions brp
        JOIN permission p ON p.id = brp.permission_id
        WHERE brp.business_id = $1 AND brp.role_id = $2
        ORDER BY p.category ASC, p.action_key ASC
      `,
      [businessId, roleId],
    );

    const data: OverrideDto[] = rows.map((r) => ({
      businessId: r.business_id,
      roleId: r.role_id,
      permissionId: r.permission_id,
      effect: r.effect,
      actionKey: r.action_key,
      name: r.name,
      category: r.category,
    }));

    return ApiResponse.success<OverrideDto[]>("Overrides del rol", data);
  }

  async resetOne(businessId: string, roleId: string, permissionId: string) {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(BusinessRolePermission)
      .where("business_id = :businessId AND role_id = :roleId AND permission_id = :permissionId", {
        businessId,
        roleId,
        permissionId,
      })
      .execute();

    if (!result.affected) throw new HttpException("Override no encontrado", HttpStatus.NOT_FOUND);

    await this.permissionsCacheService.invalidateEffectivePermissions(businessId, roleId);

    return ApiResponse.removed("Override eliminado");
  }

  async resetAll(businessId: string, roleId: string) {
    const result = await this.dataSource
      .createQueryBuilder()
      .delete()
      .from(BusinessRolePermission)
      .where("business_id = :businessId AND role_id = :roleId", { businessId, roleId })
      .execute();

    await this.permissionsCacheService.invalidateEffectivePermissions(businessId, roleId);

    return ApiResponse.removed<{ deleted: number }>("Overrides eliminados", { deleted: result.affected ?? 0 });
  }

  async hasEffectivePermission(businessId: string, roleId: string, actionKey: string): Promise<boolean> {
    const rows: { has_permission: boolean }[] = await this.dataSource.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM permission p
          LEFT JOIN role_permissions rp
            ON rp.permission_id = p.id AND rp.role_id = $2
          LEFT JOIN business_role_permissions brp
            ON brp.permission_id = p.id AND brp.role_id = $2 AND brp.business_id = $1
          WHERE p.action_key = $3
            AND p.deleted_at IS NULL
            AND (
              brp.effect = 'grant'
              OR (
                rp.role_id IS NOT NULL
                AND (brp.effect IS NULL OR brp.effect <> 'deny')
              )
            )
        ) AS has_permission
      `,
      [businessId, roleId, actionKey],
    );

    return rows[0]?.has_permission ?? false;
  }
}
