import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateBlockedDayDto {
  @IsDateString({}, { message: "Formato de fecha inválido (ISO 8601 requerido)" })
  date: string;

  @MinLength(3, { message: "La razón debe tener al menos 3 caracteres" })
  @MaxLength(50, { message: "La razón debe tener como máximo 50 caracteres" })
  @IsString({ message: "La razón debe ser una cadena de texto" })
  @IsNotEmpty({ message: "La razón es obligatoria" })
  reason: string;

  @IsUUID(4, { message: "El id del negocio debe ser un UUID" })
  @IsNotEmpty({ message: "El id del negocio es obligatorio" })
  businessId: string;

  @IsUUID(4, { message: "El id del profesional debe ser un UUID" })
  @IsNotEmpty({ message: "El id del profesional es obligatorio" })
  professionalId: string;

  @IsOptional()
  @IsBoolean({ message: "El campo recurrent debe ser un booleano" })
  recurrent?: boolean;
}
