import { IsEnum, IsNotEmpty } from "class-validator";

import { EPermissionEffect } from "@business-role-permissions/entities/business-role-permission.entity";

export class UpsertOverrideDto {
  @IsEnum(EPermissionEffect, { message: "El efecto debe ser 'grant' o 'deny'" })
  @IsNotEmpty({ message: "El efecto es obligatorio" })
  effect: EPermissionEffect;
}
