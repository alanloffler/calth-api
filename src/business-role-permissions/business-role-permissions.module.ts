import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BusinessRolePermission } from "@business-role-permissions/entities/business-role-permission.entity";
import { BusinessRolePermissionsController } from "@business-role-permissions/business-role-permissions.controller";
import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";
import { PermissionsModule } from "@permissions/permissions.module";
import { Role } from "@roles/entities/role.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessRolePermission, Role]), PermissionsModule],
  controllers: [BusinessRolePermissionsController],
  providers: [BusinessRolePermissionsService],
  exports: [BusinessRolePermissionsService],
})
export class BusinessRolePermissionsModule {}
