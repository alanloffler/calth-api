import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { PatientProfileService } from "@patient-profile/patient-profile.service";
import { UpdatePatientDto } from "@users/dto/update-patient.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class UpdatePatientUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly patientProfileService: PatientProfileService,
    private readonly usersService: UsersService,
  ) {}

  async execute(userId: string, businessId: string, updateDto: UpdatePatientDto): Promise<ApiResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateDto.user) {
        await this.usersService.updateUser(userId, businessId, updateDto.user, queryRunner.manager);
      }

      if (updateDto.profile) {
        await this.patientProfileService.update(userId, businessId, updateDto.profile, queryRunner.manager);
      }

      await queryRunner.commitTransaction();

      return ApiResponse.success("Paciente actualizado");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
