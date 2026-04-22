import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { BlockedDaysService } from "@blocked-days/blocked-days.service";
import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreateBlockedDayDto } from "@blocked-days/dto/create-blocked-day.dto";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { UpdateBlockedDayDto } from "@blocked-days/dto/update-blocked-day.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("blocked-days")
export class BlockedDaysController {
  constructor(private readonly blockedDaysService: BlockedDaysService) {}

  @RequiredPermissions("professional-update")
  @Post()
  create(@BusinessId(ParseUUIDPipe) businessId: string, @Body() createBlockedDayDto: CreateBlockedDayDto) {
    return this.blockedDaysService.create(businessId, createBlockedDayDto);
  }

  @RequiredPermissions("professional-view")
  @Get(":professionalId")
  findAll(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
  ) {
    return this.blockedDaysService.findAll(businessId, professionalId);
  }

  @RequiredPermissions("professional-update")
  @Patch(":id")
  update(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateBlockedDayDto: UpdateBlockedDayDto,
  ) {
    return this.blockedDaysService.update(businessId, id, updateBlockedDayDto);
  }

  @RequiredPermissions("professional-update")
  @Delete(":id")
  remove(@BusinessId(ParseUUIDPipe) businessId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.blockedDaysService.remove(businessId, id);
  }
}
