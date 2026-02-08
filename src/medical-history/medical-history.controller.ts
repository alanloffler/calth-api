import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreateMedicalHistoryDto } from "@medical-history/dto/create-medical-history.dto";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { MedicalHistoryService } from "@medical-history/medical-history.service";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { UpdateMedicalHistoryDto } from "@medical-history/dto/update-medical-history.dto";

// TODO: manage controllers permissions
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("medical-history")
export class MedicalHistoryController {
  constructor(private readonly medicalHistoryService: MedicalHistoryService) {}

  @RequiredPermissions("medical_history-create")
  @Post()
  create(@BusinessId(ParseUUIDPipe) businessId: string, @Body() createMedicalHistoryDto: CreateMedicalHistoryDto) {
    return this.medicalHistoryService.create(businessId, createMedicalHistoryDto);
  }

  @RequiredPermissions("medical_history-view")
  @Get()
  findAll(@BusinessId(ParseUUIDPipe) businessId: string) {
    return this.medicalHistoryService.findAll(businessId);
  }

  @RequiredPermissions("medical_history-view")
  @Get(":id/patient")
  findAllByPatient(@BusinessId(ParseUUIDPipe) businessId: string, @Param("id") id: string) {
    return this.medicalHistoryService.findAllByPatient(businessId, id);
  }

  @RequiredPermissions("medical_history-view")
  @Get(":id")
  findOne(@BusinessId(ParseUUIDPipe) businessId: string, @Param("id") id: string) {
    return this.medicalHistoryService.findOne(businessId, id);
  }

  @RequiredPermissions("medical_history-update")
  @Patch(":id")
  update(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("id") id: string,
    @Body() updateMedicalHistoryDto: UpdateMedicalHistoryDto,
  ) {
    return this.medicalHistoryService.update(id, businessId, updateMedicalHistoryDto);
  }

  @RequiredPermissions("medical_history-delete-hard")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.medicalHistoryService.remove(id);
  }
}
