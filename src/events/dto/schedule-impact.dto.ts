import { IsArray, IsInt, IsString, IsUUID, Matches, Max, Min } from "class-validator";

export class ScheduleImpactDto {
  @IsUUID(4, { message: "El id del profesional debe ser un UUID" })
  professionalId: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "El horario de inicio debe tener formato HH:MM" })
  startHour: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: "El horario de inicio debe tener formato HH:MM" })
  endHour: string;

  @IsArray({ message: "Los días laborales deben ser un array" })
  @IsInt({ each: true, message: "Cada día debe ser un número entero" })
  @Min(0, { each: true, message: "El valor mínimo de día es 0" })
  @Max(6, { each: true, message: "El valor mínimo de día es 6" })
  workingDays: number[];
}
