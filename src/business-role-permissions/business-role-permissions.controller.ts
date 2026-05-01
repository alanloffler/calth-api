import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";

import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";
import { CreateBusinessRolePermissionDto } from "@business-role-permissions/dto/create-business-role-permission.dto";
import { UpdateBusinessRolePermissionDto } from "@business-role-permissions/dto/update-business-role-permission.dto";

@Controller("business-role-permissions")
export class BusinessRolePermissionsController {
  constructor(private readonly businessRolePermissionsService: BusinessRolePermissionsService) {}

  @Post()
  create(@Body() createBusinessRolePermissionDto: CreateBusinessRolePermissionDto) {
    return this.businessRolePermissionsService.create(createBusinessRolePermissionDto);
  }

  @Get()
  findAll() {
    return this.businessRolePermissionsService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.businessRolePermissionsService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateBusinessRolePermissionDto: UpdateBusinessRolePermissionDto) {
    return this.businessRolePermissionsService.update(+id, updateBusinessRolePermissionDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.businessRolePermissionsService.remove(+id);
  }
}
