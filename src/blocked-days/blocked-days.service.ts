import { DataSource, EntityManager, QueryFailedError, Repository } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { EEventStatus } from "@common/enums/event-status.enum";
import { Event } from "@events/entities/event.entity";
import { ProfessionalProfile } from "@professional-profile/entities/professional-profile.entity";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";

@Injectable()
export class BlockedDaysService {
  constructor(
    @InjectRepository(BlockedDay) private readonly blockedDayRepository: Repository<BlockedDay>,
    private readonly dataSource: DataSource,
  ) {}

  async create(businessId: string, createBlockedDayDto: CreateBlockedDayDto): Promise<ApiResponse<BlockedDay>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const blockedDay = this.blockedDayRepository.create({ ...createBlockedDayDto, businessId });
      const savedBlockedDay = await queryRunner.manager.save(BlockedDay, blockedDay);

      await this.markEventsNeedsReschedule(
        queryRunner.manager,
        createBlockedDayDto.professionalId,
        businessId,
        createBlockedDayDto.date,
        createBlockedDayDto.recurrent ?? false,
      );

      await queryRunner.commitTransaction();
      return ApiResponse.created<BlockedDay>("Día bloqueado creado", savedBlockedDay);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === "23505") throw new HttpException("El día bloqueado ya existe", HttpStatus.CONFLICT);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(businessId: string, professionalId: string): Promise<ApiResponse<BlockedDay[]>> {
    const blockedDays = await this.blockedDayRepository.find({ where: { businessId, professionalId } });
    if (!blockedDays) throw new HttpException("Días bloqueados no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<BlockedDay[]>("Días bloqueados encontrados", blockedDays);
  }

  async update(businessId: string, id: string, updateBlockedDayDto: UpdateBlockedDayDto): Promise<ApiResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const current = await queryRunner.manager.findOne(BlockedDay, { where: { id, businessId } });
      if (!current) throw new HttpException("Día bloqueado no encontrado", HttpStatus.NOT_FOUND);

      await queryRunner.manager.update(BlockedDay, { id, businessId }, updateBlockedDayDto);

      const oldDateStr = current.date.toISOString().substring(0, 10);
      const newDateStr = updateBlockedDayDto.date?.substring(0, 10);
      const dateChanged = newDateStr !== undefined && newDateStr !== oldDateStr;
      const recurrentChanged =
        updateBlockedDayDto.recurrent !== undefined && updateBlockedDayDto.recurrent !== current.recurrent;

      if (dateChanged || recurrentChanged) {
        const profile = await queryRunner.manager.findOne(ProfessionalProfile, {
          where: { userId: current.professionalId, businessId },
        });
        if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

        const workingDays = profile.workingDays.map(Number);

        await this.revertEventsNeedsReschedule(
          queryRunner.manager,
          current.professionalId,
          businessId,
          current.date,
          current.recurrent,
          workingDays,
          profile.startHour,
          profile.endHour,
        );

        await this.markEventsNeedsReschedule(
          queryRunner.manager,
          current.professionalId,
          businessId,
          updateBlockedDayDto.date ?? current.date.toISOString(),
          updateBlockedDayDto.recurrent ?? current.recurrent,
        );
      }

      await queryRunner.commitTransaction();
      return ApiResponse.success<void>("Día bloqueado actualizado");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === "23505")
          throw new HttpException("El día bloqueado ya existe, elige otra fecha", HttpStatus.CONFLICT);
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(businessId: string, id: string): Promise<ApiResponse<void>> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const current = await queryRunner.manager.findOne(BlockedDay, { where: { id, businessId } });
      if (!current) throw new HttpException("Día bloqueado no encontrado", HttpStatus.NOT_FOUND);

      const profile = await queryRunner.manager.findOne(ProfessionalProfile, {
        where: { userId: current.professionalId, businessId },
      });
      if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

      await queryRunner.manager.delete(BlockedDay, { id, businessId });

      await this.revertEventsNeedsReschedule(
        queryRunner.manager,
        current.professionalId,
        businessId,
        current.date,
        current.recurrent,
        profile.workingDays.map(Number),
        profile.startHour,
        profile.endHour,
      );

      await queryRunner.commitTransaction();
      return ApiResponse.removed<void>("Día bloqueado eliminado");
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async markEventsNeedsReschedule(
    manager: EntityManager,
    professionalId: string,
    businessId: string,
    date: string | Date,
    recurrent: boolean,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder()
      .update(Event)
      .set({ needsReschedule: true })
      .where("professional_id = :professionalId", { professionalId })
      .andWhere("business_id = :businessId", { businessId })
      .andWhere("status = :status", { status: EEventStatus.PENDING })
      .andWhere(
        `(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
      );

    if (recurrent) {
      qb.andWhere(
        `EXTRACT(DOW FROM (start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')) = EXTRACT(DOW FROM CAST(:blockedDate AS date))`,
        { blockedDate: date },
      );
    } else {
      qb.andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = CAST(:blockedDate AS date)`, {
        blockedDate: date,
      });
    }

    await qb.execute();
  }

  private async revertEventsNeedsReschedule(
    manager: EntityManager,
    professionalId: string,
    businessId: string,
    date: string | Date,
    recurrent: boolean,
    workingDays: number[],
    startHour: string,
    endHour: string,
  ): Promise<void> {
    const qb = manager
      .createQueryBuilder()
      .update(Event)
      .set({ needsReschedule: false })
      .where("professional_id = :professionalId", { professionalId })
      .andWhere("business_id = :businessId", { businessId })
      .andWhere("status = :status", { status: EEventStatus.PENDING })
      .andWhere("needs_reschedule = true")
      .andWhere(
        `(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
      )
      .andWhere(`EXTRACT(DOW FROM start_date AT TIME ZONE 'America/Argentina/Buenos_Aires') IN (:...workingDays)`, {
        workingDays,
      })
      .andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= :startHour::time`, { startHour })
      .andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time < :endHour::time`, { endHour });

    if (recurrent) {
      qb.andWhere(
        `EXTRACT(DOW FROM (start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')) = EXTRACT(DOW FROM CAST(:blockedDate AS date))`,
        { blockedDate: date },
      );
    } else {
      qb.andWhere(`(start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = CAST(:blockedDate AS date)`, {
        blockedDate: date,
      });
    }

    qb.andWhere(`
      NOT EXISTS (
        SELECT 1 FROM blocked_days bd
        WHERE bd.professional_id = :professionalId
        AND bd.business_id = :businessId
        AND (
          (bd.recurrent = false AND (bd.date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date = (start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date)
          OR
          (bd.recurrent = true AND EXTRACT(DOW FROM bd.date AT TIME ZONE 'America/Argentina/Buenos_Aires') = EXTRACT(DOW FROM start_date AT TIME ZONE 'America/Argentina/Buenos_Aires'))
        )
      )
    `);

    await qb.execute();
  }
}
