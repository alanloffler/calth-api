import { Controller, Get, Body, Param, Delete, Put, ParseUUIDPipe } from "@nestjs/common";

import { BusinessId } from "@common/decorators/business-id.decorator";
import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";
import { UpsertOverrideDto } from "@business-role-permissions/dto/upsert-override.dto";

@Controller("roles-overrides")
export class BusinessRolePermissionsController {
  constructor(private readonly businessRolePermissionsService: BusinessRolePermissionsService) {}

  @Put(":roleId/permissions/:permissionId")
  upsert(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
    @Body() upsertDto: UpsertOverrideDto,
  ) {
    return this.businessRolePermissionsService.upsert(businessId, roleId, permissionId, upsertDto);
  }

  @Get(":roleId/overrides")
  listOverrides(@Param("roleId") roleId: string) {
    return this.businessRolePermissionsService.listOverrides(roleId);
  }

  @Get(":roleId")
  listEffective(@Param("roleId") roleId: string) {
    return this.businessRolePermissionsService.listEffective(roleId);
  }

  @Delete(":roleId/permissions/:permissionId")
  resetOne(@Param("roleId") roleId: string, @Param("permissionId") permissionId: string) {
    return this.businessRolePermissionsService.resetOne(roleId, permissionId);
  }

  @Delete(":roleId")
  resetAll(@Param("roleId") roleId: string) {
    return this.businessRolePermissionsService.resetAll(roleId);
  }
}
