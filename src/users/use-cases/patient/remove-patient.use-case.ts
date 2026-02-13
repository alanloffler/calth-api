import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { PatientProfileService } from "@patient-profile/patient-profile.service";
import { UsersService } from "@users/users.service";

@Injectable()
export class RemovePatientUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly patientProfileService: PatientProfileService,
    private readonly usersService: UsersService,
  ) {}

  async execute(userId: string, businessId: string): Promise<ApiResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.patientProfileService.remove(userId, businessId, queryRunner.manager);
      await this.usersService.remove(userId, businessId, queryRunner.manager);

      await queryRunner.commitTransaction();

      return ApiResponse.success("Paciente eliminado");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
