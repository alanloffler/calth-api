import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, Length } from "class-validator";
import { Transform } from "class-transformer";

export class CreateMedicalHistoryDto {
  @IsUUID(4, { message: "El id del paciente debe ser un UUID" })
  @IsNotEmpty({ message: "El id del paciente es obligatorio" })
  userId: string;

  @IsUUID(4, { message: "El id del negocio debe ser un UUID" })
  @IsNotEmpty({ message: "El id del negocio es obligatorio" })
  businessId: string;

  @IsUUID(4, { message: "El id del profesional debe ser un UUID" })
  @IsNotEmpty()
  professionalId: string;

  @IsUUID(4, { message: "El id del turno debe ser un UUID" })
  @IsOptional()
  eventId?: string;

  @Transform(({ value }) => new Date(value))
  @IsNotEmpty({ message: "La fecha es obligatoria" })
  date: Date;

  @Length(3, 50, { message: "El motivo debe tener entre 3 y 50 caracteres" })
  @IsString({ message: "El motivo debe ser una cadena de texto" })
  @Transform(({ value }) => value?.trim())
  reason: string;

  @Length(3, 1000, { message: "Los comentarios deben tener entre 3 y 1000 caracteres" })
  @IsString({ message: "Los comentarios deben ser una cadena de texto" })
  @Transform(({ value }) => value?.trim())
  comments: string;

  @IsBoolean({ message: "La receta del turno debe ser un booleano" })
  @IsOptional()
  recipe?: boolean;
}
