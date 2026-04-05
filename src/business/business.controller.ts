import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common";

import { BusinessService } from "@business/business.service";
import { CreateBusinessFullDto } from "@business/dto/create-business-full.dto";
import { CreateBusinessWithAdminUseCase } from "@business/use-cases/create-business-with-admin.use-case";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { UpdateBusinessDto } from "@business/dto/update-business.dto";

// TODO: add permissions
@Controller("businesses")
export class BusinessController {
  constructor(
    private readonly businessService: BusinessService,
    private readonly createBusinessWithAdminUseCase: CreateBusinessWithAdminUseCase,
  ) {}

  @Post()
  create(@Body() createBusinessFullDto: CreateBusinessFullDto) {
    return this.createBusinessWithAdminUseCase.execute(createBusinessFullDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  findAll() {
    return this.businessService.findAll();
  }

  @Get("availability/tax-id/:taxId")
  checkTaxIdAvailability(@Param("taxId") taxId: string) {
    return this.businessService.checkTaxIdAvailability(taxId);
  }

  @Get("availability/slug/:slug")
  checkSlugAvailability(@Param("slug") slug: string) {
    return this.businessService.checkSlugAvailability(slug);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.businessService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.update(id, updateBusinessDto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.businessService.remove(id);
  }
}
