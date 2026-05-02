import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BusinessRolePermission } from "@business-role-permissions/entities/business-role-permission.entity";
import { BusinessRolePermissionsController } from "@business-role-permissions/business-role-permissions.controller";
import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";
import { Role } from "@roles/entities/role.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BusinessRolePermission, Role])],
  controllers: [BusinessRolePermissionsController],
  providers: [BusinessRolePermissionsService],
})
export class BusinessRolePermissionsModule {}
