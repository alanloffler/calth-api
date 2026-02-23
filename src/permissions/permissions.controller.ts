import { Controller, Get, Post, Body, Patch, Param, UseGuards, ParseUUIDPipe, Delete } from "@nestjs/common";

import { CreatePermissionDto } from "@permissions/dto/create-permission.dto";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { PermissionsService } from "@permissions/permissions.service";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { UpdatePermissionDto } from "@permissions/dto/update-permission.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @RequiredPermissions("permissions-create")
  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @RequiredPermissions("permissions-view")
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @RequiredPermissions("roles-update")
  @RequiredPermissions("permissions-view")
  @Get("grouped")
  findAllGrouped() {
    return this.permissionsService.findAllGrouped();
  }

  @RequiredPermissions("permissions-create")
  @RequiredPermissions("permissions-update")
  @RequiredPermissions("permissions-view")
  @Get("category/:category")
  findAllByCategory(@Param("category") category: string) {
    return this.permissionsService.findAllByCategory(category);
  }

  @RequiredPermissions("permissions-view")
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.findOne(id);
  }

  @RequiredPermissions("permissions-restore")
  @Patch(":id/restore")
  restore(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.restore(id);
  }

  @RequiredPermissions("permissions-update")
  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(id, updatePermissionDto);
  }

  @RequiredPermissions("permissions-delete")
  @Delete(":id/soft")
  softRemove(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.softRemove(id);
  }

  @RequiredPermissions("permissions-delete-hard")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.permissionsService.remove(id);
  }
}
