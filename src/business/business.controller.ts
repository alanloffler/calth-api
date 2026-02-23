import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common";

import { BusinessId } from "@common/decorators/business-id.decorator";
import { BusinessService } from "@business/business.service";
import { CreateBusinessDto } from "@business/dto/create-business.dto";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { UpdateBusinessDto } from "@business/dto/update-business.dto";

// TODO: add permissions
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("businesses")
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  create(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(createBusinessDto);
  }

  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Get("check-slug-availability/:slug")
  checkSlugAvailability(@Param("slug") slug: string) {
    return this.businessService.checkSlugAvailability(slug);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.businessService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(id, updateBusinessDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.businessService.remove(id);
  }
}
