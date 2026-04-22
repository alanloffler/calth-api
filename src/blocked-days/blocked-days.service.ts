import { InjectRepository } from "@nestjs/typeorm";
import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";

@Injectable()
export class BlockedDaysService {
  constructor(@InjectRepository(BlockedDay) private readonly blockedDayRepository: Repository<BlockedDay>) {}

  async create(businessId: string, createBlockedDayDto: CreateBlockedDayDto) {
    console.log(createBlockedDayDto);
    return `This action adds a new blockedDay to business #${businessId}`;
  }

  async findOne(businessId: string, id: string) {
    return `This action returns blockedDay #${id} from business #${businessId}`;
  }

  async update(businessId: string, id: string, updateBlockedDayDto: UpdateBlockedDayDto) {
    console.log(updateBlockedDayDto);
    return `This action updates blockedDay #${id} from business #${businessId}`;
  }

  async remove(businessId: string, id: string) {
    return `This action removes blockedDay #${id} from business #${businessId}`;
  }
}
