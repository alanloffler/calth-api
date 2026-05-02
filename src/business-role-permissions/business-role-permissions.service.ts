import { DataSource } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { BusinessRolePermission } from "./entities/business-role-permission.entity";
import { UpsertOverrideDto } from "@business-role-permissions/dto/upsert-override.dto";

@Injectable()
export class BusinessRolePermissionsService {
  constructor(private readonly dataSource: DataSource) {}

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

    return ApiResponse.success<BusinessRolePermission>("Override guardado", result.raw[0]);
  }

  async listEffective(roleId: string) {
    return `This action list effective overrides`;
  }

  async listOverrides(id: string) {
    return `This action list overrides`;
  }

  async resetOne(roleId: string, permissionId: string) {
    return `This action reset one businessRolePermission`;
  }

  async resetAll(roleId: string) {
    return `This action reset all businessRolePermission`;
  }
}
