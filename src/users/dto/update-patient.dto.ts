import { IsObject, IsOptional, ValidateNested } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import { Type } from "class-transformer";

import { CreatePatientProfileDto } from "@patient-profile/dto/create-patient-profile.dto";
import { CreateUserDto } from "@users/dto/create-user.dto";

class UpdateUserDataDto extends PartialType(CreateUserDto) {}
class UpdateProfileDataDto extends PartialType(CreatePatientProfileDto) {}

export class UpdatePatientDto {
  @ValidateNested()
  @IsObject({ message: "Los datos del usuario deben ser un objeto" })
  @IsOptional()
  @Type(() => UpdateUserDataDto)
  user?: CreateUserDto;

  @ValidateNested()
  @IsObject({ message: "Los datos del perfil de paciente deben ser un objeto" })
  @IsOptional()
  @Type(() => UpdateProfileDataDto)
  profile?: UpdateProfileDataDto;
}
