import { InjectRepository } from "@nestjs/typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";
import { ApiResponse } from "@common/helpers/api-response.helper";

@Injectable()
export class BlockedDaysService {
  constructor(@InjectRepository(BlockedDay) private readonly blockedDayRepository: Repository<BlockedDay>) {}

  async create(businessId: string, createBlockedDayDto: CreateBlockedDayDto): Promise<ApiResponse<BlockedDay>> {
    const blockedDay = this.blockedDayRepository.create({ ...createBlockedDayDto, businessId });
    const savedBlockedDay = await this.blockedDayRepository.save(blockedDay);
    if (!savedBlockedDay) throw new HttpException("Error al crear día bloqueado", HttpStatus.INTERNAL_SERVER_ERROR);
    // TODO: throw custom exception on duplicated blocked day

    return ApiResponse.created<BlockedDay>("Día bloqueado creado", savedBlockedDay);
  }

  async findAll(businessId: string, professionalId: string): Promise<ApiResponse<BlockedDay[]>> {
    const blockedDays = await this.blockedDayRepository.find({ where: { businessId, professionalId } });
    if (!blockedDays) throw new HttpException("Días bloqueados no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<BlockedDay[]>("Días bloqueados encontrados", blockedDays);
  }

  async update(businessId: string, id: string, updateBlockedDayDto: UpdateBlockedDayDto) {
    console.log(updateBlockedDayDto);
    return `This action updates blockedDay #${id} from business #${businessId}`;
  }

  async remove(businessId: string, id: string) {
    return `This action removes blockedDay #${id} from business #${businessId}`;
  }
}
