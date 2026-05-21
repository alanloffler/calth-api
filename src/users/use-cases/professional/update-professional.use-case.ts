import { Brackets, DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { EEventStatus } from "@common/enums/event-status.enum";
import { Event } from "@events/entities/event.entity";
import { ProfessionalProfile } from "@professional-profile/entities/professional-profile.entity";
import { ProfessionalProfileService } from "@professional-profile/professional-profile.service";
import { UpdateProfessionalDto } from "@users/dto/update-professional.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class UpdateProfessionalUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly professionalProfileService: ProfessionalProfileService,
    private readonly usersService: UsersService,
  ) {}

  async execute(userId: string, businessId: string, updateDto: UpdateProfessionalDto): Promise<ApiResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (updateDto.user) {
        await this.usersService.updateUser(userId, businessId, updateDto.user, queryRunner.manager);
      }

      if (updateDto.profile) {
        const currentProfile = await queryRunner.manager.findOne(ProfessionalProfile, {
          where: { userId, businessId },
        });

        await this.professionalProfileService.update(userId, businessId, updateDto.profile, queryRunner.manager);

        if (currentProfile && this.hasScheduleChanged(updateDto.profile, currentProfile)) {
          const newStartHour = updateDto.profile.startHour ?? currentProfile.startHour;
          const newEndHour = updateDto.profile.endHour ?? currentProfile.endHour;
          const newWorkingDays = (updateDto.profile.workingDays ?? currentProfile.workingDays).map(Number);

          // Scan and assign needsReschedule
          await queryRunner.manager
            .createQueryBuilder()
            .update(Event)
            .set({ needsReschedule: true })
            .where("professional_id = :userId", { userId })
            .andWhere("business_id = :businessId", { businessId })
            .andWhere("status = :status", { status: EEventStatus.PENDING })
            .andWhere(
              `(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
            )
            .andWhere(
              new Brackets((qb) => {
                qb.where(
                  `EXTRACT(DOW FROM start_date AT TIME ZONE 'America/Argentina/Buenos_Aires') NOT IN (:...workingDays)`,
                  { workingDays: newWorkingDays },
                )
                  .orWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time < :startHour::time`, {
                    startHour: newStartHour,
                  })
                  .orWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= :endHour::time`, {
                    endHour: newEndHour,
                  });
              }),
            )
            .execute();

          // Scan and revert needsReschedule
          await queryRunner.manager
            .createQueryBuilder()
            .update(Event)
            .set({ needsReschedule: false })
            .where("professional_id = :userId", { userId })
            .andWhere("business_id = :businessId", { businessId })
            .andWhere("status = :status", { status: EEventStatus.PENDING })
            .andWhere("needs_reschedule = true")
            .andWhere(
              `(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
            )
            .andWhere(
              `EXTRACT(DOW FROM start_date AT TIME ZONE 'America/Argentina/Buenos_Aires') IN (:...workingDays)`,
              { workingDays: newWorkingDays },
            )
            .andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= :startHour::time`, {
              startHour: newStartHour,
            })
            .andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time < :endHour::time`, {
              endHour: newEndHour,
            })
            .andWhere(
              `
              NOT EXISTS (
                SELECT 1 FROM blocked_days bd
                WHERE bd.professional_id = :userId
                AND bd.business_id = :businessId
                AND (
                  (bd.recurrent = false AND (bd.date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)
                  OR
                  (bd.recurrent = true AND EXTRACT(DOW FROM bd.date AT TIME ZONE 'America/Argentina/Buenos_Aires') = EXTRACT(DOW FROM start_date AT TIME ZONE 'America/Argentina/Buenos_Aires'))
                )
              )
            `,
            )
            .execute();
        }
      }

      await queryRunner.commitTransaction();
      return ApiResponse.success("Profesional actualizado");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private hasScheduleChanged(
    dto: { startHour?: string; endHour?: string; workingDays?: number[] },
    current: ProfessionalProfile,
  ): boolean {
    const startChanged = dto.startHour !== undefined && dto.startHour !== current.startHour;
    const endChanged = dto.endHour !== undefined && dto.endHour !== current.endHour;
    const daysChanged =
      dto.workingDays !== undefined &&
      [...dto.workingDays].map(Number).sort().join(",") !== [...current.workingDays].map(Number).sort().join(",");

    return startChanged || endChanged || daysChanged;
  }
}
