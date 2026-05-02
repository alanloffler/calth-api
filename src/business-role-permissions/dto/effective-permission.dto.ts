import { EPermissionEffect } from "@business-role-permissions/entities/business-role-permission.entity";

export interface EffectivePermissionDto {
  id: string;
  name: string;
  category: string;
  actionKey: string;
  description: string;
  inBaseline: boolean;
  overrideEffect: EPermissionEffect | null;
  isEffective: boolean;
}
