import { Module } from "@nestjs/common";

import { BusinessRolePermissionsController } from "@business-role-permissions/business-role-permissions.controller";
import { BusinessRolePermissionsService } from "@business-role-permissions/business-role-permissions.service";

@Module({
  controllers: [BusinessRolePermissionsController],
  providers: [BusinessRolePermissionsService],
})
export class BusinessRolePermissionsModule {}
