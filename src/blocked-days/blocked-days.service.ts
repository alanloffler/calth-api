import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";

@Injectable()
export class BlockedDaysService {
  constructor(@InjectRepository(BlockedDay) private readonly blockedDayRepository: Repository<BlockedDay>) {}

  async create(businessId: string, createBlockedDayDto: CreateBlockedDayDto): Promise<ApiResponse<BlockedDay>> {
    try {
      const blockedDay = this.blockedDayRepository.create({ ...createBlockedDayDto, businessId });
      const savedBlockedDay = await this.blockedDayRepository.save(blockedDay);

      return ApiResponse.created<BlockedDay>("Día bloqueado creado", savedBlockedDay);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === "23505") {
          throw new HttpException("El día bloqueado ya existe", HttpStatus.CONFLICT);
        }
      }
      throw new HttpException("Error al crear el día bloqueado", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(businessId: string, professionalId: string): Promise<ApiResponse<BlockedDay[]>> {
    const blockedDays = await this.blockedDayRepository.find({ where: { businessId, professionalId } });
    if (!blockedDays) throw new HttpException("Días bloqueados no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<BlockedDay[]>("Días bloqueados encontrados", blockedDays);
  }

  async update(businessId: string, id: string, updateBlockedDayDto: UpdateBlockedDayDto): Promise<ApiResponse<void>> {
    try {
      const update = await this.blockedDayRepository.update({ id, businessId }, updateBlockedDayDto);
      if (update.affected === 0) throw new HttpException("Día bloqueado no encontrado", HttpStatus.NOT_FOUND);

      return ApiResponse.success<void>("Día bloqueado actualizado");
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error as any;
        if (pgError.code === "23505") {
          throw new HttpException("El día bloqueado ya existe, elige otra fecha", HttpStatus.CONFLICT);
        }
      }
      throw new HttpException("Error al actualizar el día bloqueado", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(businessId: string, id: string): Promise<ApiResponse<void>> {
    const remove = await this.blockedDayRepository.delete({ id, businessId });
    if (!remove) throw new HttpException("Error eliminando día bloqueado", HttpStatus.INTERNAL_SERVER_ERROR);
    if (remove.affected === 0) throw new HttpException("Día bloqueado no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.removed<void>("Día bloqueado eliminado");
  }
}
