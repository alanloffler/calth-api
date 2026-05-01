import { PartialType } from "@nestjs/mapped-types";

import { CreateBusinessRolePermissionDto } from "@business-role-permissions/dto/create-business-role-permission.dto";

export class UpdateBusinessRolePermissionDto extends PartialType(CreateBusinessRolePermissionDto) {}
