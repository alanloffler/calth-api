import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards, Request } from "@nestjs/common";

import type { IRequest } from "@auth/interfaces/request.interface";
import { CreateRoleDto } from "@roles/dto/create-role.dto";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { RolesService } from "@roles/roles.service";
import { UpdateRoleDto } from "@roles/dto/update-role.dto";

@Controller("roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-create")
  @Post()
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-view")
  @Get()
  findAll(@Request() req: IRequest) {
    return this.rolesService.findAll(req);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-view")
  @Get("soft")
  findAllSoftRemoved(@Request() req: IRequest) {
    return this.rolesService.findAllSoftRemoved(req);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-view")
  @Get(":id/soft")
  findOneSoftRemoved(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.findOneSoftRemoved(req, id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-view")
  @Get(":id")
  findOne(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.findOne(req, id);
  }

  @Get("/value/:id")
  findIdByValue(@Param("value") value: string) {
    return this.rolesService.findIdByValue(value);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-restore")
  @Patch(":id/restore")
  restore(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.restore(req, id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-update")
  @Patch(":id")
  update(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(req, id, updateRoleDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-delete")
  @Delete(":id/soft")
  softRemove(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.softRemove(req, id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions("roles-delete-hard")
  @Delete(":id")
  remove(@Request() req: IRequest, @Param("id", ParseUUIDPipe) id: string) {
    return this.rolesService.remove(req, id);
  }
}
