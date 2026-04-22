import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from "@nestjs/common";

import { BlockedDaysService } from "@blocked-days/blocked-days.service";
import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";

@Controller("blocked-days")
export class BlockedDaysController {
  constructor(private readonly blockedDaysService: BlockedDaysService) {}

  @Post()
  create(@BusinessId(ParseUUIDPipe) businessId: string, @Body() createBlockedDayDto: CreateBlockedDayDto) {
    return this.blockedDaysService.create(businessId, createBlockedDayDto);
  }

  @Get(":professionalId")
  findAll(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
  ) {
    return this.blockedDaysService.findAll(businessId, professionalId);
  }

  @Patch(":id")
  update(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBlockedDayDto: UpdateBlockedDayDto,
  ) {
    return this.blockedDaysService.update(businessId, id, updateBlockedDayDto);
  }

  @Delete(":id")
  remove(@BusinessId(ParseUUIDPipe) businessId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.blockedDaysService.remove(businessId, id);
  }
}
