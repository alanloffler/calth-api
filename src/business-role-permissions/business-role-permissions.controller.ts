import { Controller, Get, Body, Param, Delete, Put, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { BusinessId } from "@common/decorators/business-id.decorator";
import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { UpsertOverrideDto } from "@business-role-permissions/dto/upsert-override.dto";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("roles-overrides")
export class BusinessRolePermissionsController {
  constructor(private readonly businessRolePermissionsService: BusinessRolePermissionsService) {}

  @RequiredPermissions("roles-update")
  @Put(":roleId/permissions/:permissionId")
  upsert(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
    @Body() upsertDto: UpsertOverrideDto,
  ) {
    return this.businessRolePermissionsService.upsert(businessId, roleId, permissionId, upsertDto);
  }

  @RequiredPermissions("roles-view")
  @Get(":roleId/overrides")
  listOverrides(@BusinessId(ParseUUIDPipe) businessId: string, @Param("roleId", ParseUUIDPipe) roleId: string) {
    return this.businessRolePermissionsService.listOverrides(businessId, roleId);
  }

  @RequiredPermissions("roles-view")
  @Get(":roleId")
  listEffective(@BusinessId(ParseUUIDPipe) businessId: string, @Param("roleId", ParseUUIDPipe) roleId: string) {
    return this.businessRolePermissionsService.listEffective(businessId, roleId);
  }

  @RequiredPermissions("roles-update")
  @Delete(":roleId/permissions/:permissionId")
  resetOne(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
  ) {
    return this.businessRolePermissionsService.resetOne(businessId, roleId, permissionId);
  }

  @RequiredPermissions("roles-update")
  @Delete(":roleId")
  resetAll(@BusinessId(ParseUUIDPipe) businessId: string, @Param("roleId", ParseUUIDPipe) roleId: string) {
    return this.businessRolePermissionsService.resetAll(businessId, roleId);
  }
}
