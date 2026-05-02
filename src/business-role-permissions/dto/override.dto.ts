import { EPermissionEffect } from "@business-role-permissions/entities/business-role-permission.entity";

export interface OverrideDto {
  businessId: string;
  roleId: string;
  permissionId: string;
  effect: EPermissionEffect;
  actionKey: string;
  name: string;
  category: string;
}
