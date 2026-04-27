import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Request,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Query,
} from "@nestjs/common";

import type { IRequest } from "@auth/interfaces/request.interface";
import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreatePatientDto } from "@users/dto/create-patient.dto";
import { CreatePatientUseCase } from "@users/use-cases/patient/create-patient.use-case";
import { CreateProfessionalDto } from "@users/dto/create-professional.dto";
import { CreateProfessionalUseCase } from "@users/use-cases/professional/create-professional.use-case";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { RemovePatientUseCase } from "@users/use-cases/patient/remove-patient.use-case";
import { RemoveProfessionalUseCase } from "@users/use-cases/professional/remove-professional.use-case";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { RestorePatientUseCase } from "@users/use-cases/patient/restore-patient.use-case";
import { RestoreProfessionalUseCase } from "@users/use-cases/professional/restore-professional.use-case";
import { SoftRemovePatientUserCase } from "@users/use-cases/patient/soft-remove-patient.use-case";
import { SoftRemoveProfessionalUserCase } from "@users/use-cases/professional/soft-remove-professional.use-case";
import { UpdatePatientDto } from "@users/dto/update-patient.dto";
import { UpdatePatientUseCase } from "@users/use-cases/professional/update-patient.use-case";
import { UpdateProfessionalDto } from "@users/dto/update-professional.dto";
import { UpdateProfessionalUseCase } from "@users/use-cases/professional/update-professional.use-case";
import { UpdateUserDto } from "@users/dto/update-user.dto";
import { UsersService } from "@users/users.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("users")
export class UsersController {
  constructor(
    private readonly createPatientUseCase: CreatePatientUseCase,
    private readonly createProfessionalUseCase: CreateProfessionalUseCase,
    private readonly removePatientUseCase: RemovePatientUseCase,
    private readonly removeProfessionalUseCase: RemoveProfessionalUseCase,
    private readonly restorePatientUseCase: RestorePatientUseCase,
    private readonly restoreProfessionalUseCase: RestoreProfessionalUseCase,
    private readonly softRemovePatientUseCase: SoftRemovePatientUserCase,
    private readonly softRemoveProfessionalUseCase: SoftRemoveProfessionalUserCase,
    private readonly updatePatientUseCase: UpdatePatientUseCase,
    private readonly updateProfessionalUseCase: UpdateProfessionalUseCase,
    private readonly usersService: UsersService,
  ) {}

  @RequiredPermissions("professional-create")
  @Post("patient")
  createPatient(@Body() patientDto: CreatePatientDto, @BusinessId() businessId: string) {
    return this.createPatientUseCase.execute(patientDto, businessId);
  }

  @RequiredPermissions("professional-create")
  @Post("professional")
  createProfessional(@Body() professionalDto: CreateProfessionalDto, @BusinessId() businessId: string) {
    return this.createProfessionalUseCase.execute(professionalDto, businessId);
  }

  @RequiredPermissions(
    ["admin-create", "admin-update", "patient-create", "patient-update", "professional-create", "professional-update"],
    "some",
  )
  @Get("check/email/:email")
  checkEmailAvailability(@Param("email") email: string, @BusinessId() businessId: string) {
    return this.usersService.checkEmailAvailability(email, businessId);
  }

  @RequiredPermissions(
    ["admin-create", "admin-update", "patient-create", "patient-update", "professional-create", "professional-update"],
    "some",
  )
  @Get("check/ic/:ic")
  checkIcAvailability(@Param("ic") id: string, @BusinessId() businessId: string) {
    return this.usersService.checkIcAvailability(id, businessId);
  }

  @RequiredPermissions(
    ["admin-create", "admin-update", "patient-create", "patient-update", "professional-create", "professional-update"],
    "some",
  )
  @Get("check/username/:username")
  checkUsernameAvailability(@Param("username") userName: string, @BusinessId() businessId: string) {
    return this.usersService.checkUsernameAvailability(userName, businessId);
  }

  // Without permissions, user can view his own profile
  // CHECK USE OF THIS CONTROLLER: this is the only which must
  // retrieve data with permissions!
  @Get("profile")
  findMe(@Request() req: IRequest, @BusinessId() businessId: string) {
    const userId = req.user.id;
    return this.usersService.findOne(userId, businessId);
  }

  // Without permissions, admin can update his own profile
  // TODO: MAKE SERVICE FOR THIS
  // @Patch("profile")
  // updateProfile(@Request() req: IRequest, @Body() user: UpdateUserDto, @BusinessId() businessId: string) {
  //   const userId = req.user.id;
  //   return this.usersService.update(userId, user, businessId);
  // }

  @RequiredPermissions("patient-view")
  @Get("role/patient")
  findLatestPatients(@BusinessId(ParseUUIDPipe) businessId: string, @Query("limit") limit: string) {
    return this.usersService.findLatestPatients(businessId, limit);
  }

  // IMPORTANT: this is consumed on superadmin logged user finding user by role (all 3)
  @RequiredPermissions(["admin-view", "patient-view", "professional-view"], "some")
  @Get("role/:role/soft")
  findAllSoftRemoved(@Param("role") role: string, @BusinessId() businessId: string) {
    return this.usersService.findAllSoftRemoved(role, businessId);
  }

  // TODO: refactor into a new controller to handle only professionals
  // Or see what FE is consuming (use findProfessionalWithProfile???)
  @RequiredPermissions(["admin-view", "patient-view", "professional-view"], "some")
  @Get("role/:role")
  findAll(@Param("role") role: string, @BusinessId() businessId: string) {
    return this.usersService.findAll(role, businessId);
  }

  // Find admin
  @RequiredPermissions("admin-view")
  @Get(":id/admin/profile")
  findAdmin(@BusinessId() businessId: string, @Param("id") id: string) {
    return this.usersService.findAdmin(businessId, id);
  }

  // Find patient soft removed with profile
  @RequiredPermissions("patient-view")
  @Get(":id/patient/profile/soft")
  findPatientSoftRemovedWithProfile(@BusinessId() businessId: string, @Param("id") id: string) {
    return this.usersService.findPatientSoftRemovedWithProfile(businessId, id);
  }

  // Find patient with profile (not soft removed)
  @RequiredPermissions("patient-view")
  @Get(":id/patient/profile")
  findPatientWithProfile(@BusinessId() businessId: string, @Param("id") id: string) {
    return this.usersService.findPatientWithProfile(businessId, id);
  }

  @RequiredPermissions(["admin-view", "patient-view", "professional-view"], "some")
  @Get("soft-remove/:id")
  findOneSoftRemoved(@Param("id", ParseUUIDPipe) id: string, @BusinessId() businessId: string) {
    return this.usersService.findOneSoftRemoved(id, businessId);
  }

  @RequiredPermissions(["admin-view", "patient-view", "professional-view"], "some")
  @Get("credential/:id")
  findOneWithCredentials(@Param("id", ParseUUIDPipe) id: string, @BusinessId() businessId: string) {
    return this.usersService.findOneWithCredentials(id, businessId);
  }

  // User by role with profile
  @RequiredPermissions("professional-view")
  @Get(":id/professional/profile/soft")
  findProfessionalSoftRemovedWithProfile(@BusinessId(ParseUUIDPipe) businessId: string, @Param("id") id: string) {
    return this.usersService.findProfessionalSoftRemovedWithProfile(businessId, id);
  }

  // FE: used on Calendar and Professional combobox
  @RequiredPermissions("professional-view")
  @Get(":id/professional/profile")
  findProfessionalWithProfile(@Param("id") id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.usersService.findProfessionalWithProfile(id, businessId);
  }

  @RequiredPermissions(["admin-view", "patient-view", "professional-view"], "some")
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @BusinessId() businessId: string) {
    return this.usersService.findOne(id, businessId);
  }

  // Patch controllers
  @RequiredPermissions(["admin-update", "patient-update", "professional-update"], "some")
  @Patch("profile")
  updateProfile(
    @Request() req: IRequest,
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Body() userDto: UpdateUserDto,
  ) {
    const userId = req.user.id;
    return this.usersService.update(userId, businessId, userDto);
  }

  @RequiredPermissions("patient-restore")
  @Patch(":id/patient/restore")
  restorePatient(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.restorePatientUseCase.execute(id, businessId);
  }

  @RequiredPermissions("professional-restore")
  @Patch(":id/professional/restore")
  restoreProfessional(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.restoreProfessionalUseCase.execute(id, businessId);
  }

  @RequiredPermissions("patient-update")
  @Patch(":id/patient")
  updatePatient(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
    @BusinessId() businessId: string,
  ) {
    return this.updatePatientUseCase.execute(id, businessId, updatePatientDto);
  }

  @RequiredPermissions("professional-update")
  @Patch(":id/professional")
  updateProfessional(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
    @BusinessId() businessId: string,
  ) {
    return this.updateProfessionalUseCase.execute(id, businessId, updateProfessionalDto);
  }

  @RequiredPermissions(["admin-update", "patient-update", "professional-update"], "some")
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @BusinessId() businessId: string,
  ) {
    return this.usersService.update(id, businessId, updateUserDto);
  }

  @RequiredPermissions("patient-delete")
  @Delete(":id/patient/soft")
  softRemovePatient(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.softRemovePatientUseCase.execute(id, businessId);
  }

  @RequiredPermissions("professional-delete")
  @Delete(":id/professional/soft")
  softRemoveProfessional(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.softRemoveProfessionalUseCase.execute(id, businessId);
  }

  @RequiredPermissions("patient-delete-hard")
  @Delete(":id/patient")
  removePatient(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.removePatientUseCase.execute(id, businessId);
  }

  @RequiredPermissions("professional-delete-hard")
  @Delete(":id/professional")
  removeProfessional(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.removeProfessionalUseCase.execute(id, businessId);
  }
}
