import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

import { EModule } from "@common/enums/module.enum";
import { ESubmodule } from "@/common/enums/submodule.enum";

export class CreateSettingDto {
  @MinLength(3, { message: "La llave debe tener al menos 3 caracteres" })
  @IsString({ message: "La llave debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La llave es obligatoria" })
  key: string;

  @IsEnum(EModule, {
    message: `El módulo debe ser uno de los siguientes: ${Object.values(EModule).join(", ")}`,
  })
  @IsNotEmpty({ message: "El módulo es obligatorio" })
  module: EModule;

  @IsEnum(EModule, {
    message: `El submódulo debe ser uno de los siguientes: ${Object.values(ESubmodule).join(", ")}`,
  })
  @IsOptional()
  submodule?: ESubmodule;

  @MinLength(3, { message: "El título debe tener al menos 3 caracteres" })
  @IsString({ message: "El título debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El título es obligatorio" })
  title: string;

  @MinLength(2, { message: "El valor debe tener al menos 2 caracteres" })
  @IsString({ message: "El valor debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El valor es obligatorio" })
  value: string;
}
