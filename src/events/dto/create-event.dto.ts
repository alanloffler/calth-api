import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreateEventDto {
  @MinLength(3, { message: "El título debe tener al menos 3 caracteres" })
  @IsString({ message: "El título debe ser una cadena de texto" })
  @IsNotEmpty({ message: "El título es obligatorio" })
  title: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Formato de fecha de inicio incorrecto" })
  startDate?: Date;

  @Type(() => Date)
  @IsDate({ message: "Formato de fecha de finalización incorrecto" })
  @IsNotEmpty({ message: "La fecha y hora de finalización es obligatoria" })
  endDate: Date;

  @IsOptional()
  @IsArray({ message: "Las fechas recurrentes deben ser un array" })
  @Type(() => Date)
  @IsDate({ each: true, message: "Formato de fecha recurrente incorrecto" })
  recurringDates?: Date[];

  @IsUUID(4, { message: "El id del profesional debe ser un UUID" })
  @IsNotEmpty({ message: "El profesional es obligatorio" })
  professionalId: string;

  @IsUUID(4, { message: "El id del paciente debe ser un UUID" })
  @IsNotEmpty({ message: "El paciente es obligatorio" })
  userId: string;
}
