import { IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class CreateApiKeyDto {
  @MaxLength(50, { message: "El proveedor no puede superar 50 caracteres" })
  @MinLength(3, { message: "El proveedor debe tener al menos 3 caracteres" })
  @IsString({ message: "El proveedor debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El proveedor es obligatorio" })
  name: string;

  @IsString({ message: "La clave debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La clave es obligatoria" })
  key: string;
}
