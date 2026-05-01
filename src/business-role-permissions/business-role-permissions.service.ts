import { Injectable } from "@nestjs/common";

import { CreateBusinessRolePermissionDto } from "@business-role-permissions/dto/create-business-role-permission.dto";
import { UpdateBusinessRolePermissionDto } from "@business-role-permissions/dto/update-business-role-permission.dto";

@Injectable()
export class BusinessRolePermissionsService {
  create(createBusinessRolePermissionDto: CreateBusinessRolePermissionDto) {
    return "This action adds a new businessRolePermission";
  }

  findAll() {
    return `This action returns all businessRolePermissions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} businessRolePermission`;
  }

  update(id: number, updateBusinessRolePermissionDto: UpdateBusinessRolePermissionDto) {
    return `This action updates a #${id} businessRolePermission`;
  }

  remove(id: number) {
    return `This action removes a #${id} businessRolePermission`;
  }
}
