import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreatePatientUseCase } from "@users/use-cases/patient/create-patient.use-case";
import { CreateProfessionalUseCase } from "@users/use-cases/professional/create-professional.use-case";
import { PatientProfileService } from "@patient-profile/patient-profile.service";
import { ProfessionalProfileService } from "@professional-profile/professional-profile.service";
import { RemovePatientUseCase } from "@users/use-cases/patient/remove-patient.use-case";
import { RemoveProfessionalUseCase } from "@users/use-cases/professional/remove-professional.use-case";
import { RestorePatientUseCase } from "@users/use-cases/patient/restore-patient.use-case";
import { RestoreProfessionalUseCase } from "@users/use-cases/professional/restore-professional.use-case";
import { Role } from "@roles/entities/role.entity";
import { SoftRemovePatientUserCase } from "@users/use-cases/patient/soft-remove-patient.use-case";
import { SoftRemoveProfessionalUserCase } from "@users/use-cases/professional/soft-remove-professional.use-case";
import { UpdateProfessionalUseCase } from "@users/use-cases/professional/update-professional.use-case";
import { User } from "@users/entities/user.entity";
import { UsersController } from "@users/users.controller";
import { UsersService } from "@users/users.service";

@Module({
  imports: [TypeOrmModule.forFeature([Role, User])],
  controllers: [UsersController],
  providers: [
    CreatePatientUseCase,
    CreateProfessionalUseCase,
    PatientProfileService,
    ProfessionalProfileService,
    RemovePatientUseCase,
    RemoveProfessionalUseCase,
    RestorePatientUseCase,
    RestoreProfessionalUseCase,
    SoftRemovePatientUserCase,
    SoftRemoveProfessionalUserCase,
    UpdateProfessionalUseCase,
    UsersService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
