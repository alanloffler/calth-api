import { EntityManager } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { CreatePatientProfileDto } from "@patient-profile/dto/create-patient-profile.dto";
import { PatientProfile } from "@patient-profile/entities/patient-profile.entity";
import { UpdatePatientProfileDto } from "@patient-profile/dto/update-patient-profile.dto";

@Injectable()
export class PatientProfileService {
  async create(
    profileDto: CreatePatientProfileDto,
    userId: string,
    businessId: string,
    manager: EntityManager,
  ): Promise<PatientProfile> {
    const existingProfile = await manager.findOne(PatientProfile, { where: { businessId, userId } });
    if (existingProfile) throw new HttpException("El paciente ya tiene un perfil", HttpStatus.BAD_REQUEST);

    const profile = manager.create(PatientProfile, {
      ...profileDto,
      userId,
      businessId,
    });

    try {
      return manager.save(profile);
    } catch {
      throw new HttpException("Error al crear el perfil del paciente", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(userId: string, businessId: string, profileDto: UpdatePatientProfileDto, manager: EntityManager) {
    const profile = await manager.findOne(PatientProfile, { where: { businessId, userId } });
    if (!profile) throw new HttpException("El paciente no tiene un perfil", HttpStatus.NOT_FOUND);

    if (profileDto.gender !== undefined) profile.gender = profileDto.gender;
    if (profileDto.birthDay !== undefined) profile.birthDay = profileDto.birthDay;
    if (profileDto.bloodType !== undefined) profile.bloodType = profileDto.bloodType;
    if (profileDto.weight !== undefined) profile.weight = profileDto.weight;
    if (profileDto.height !== undefined) profile.height = profileDto.height;
    if (profileDto.emergencyContactName !== undefined) profile.emergencyContactName = profileDto.emergencyContactName;
    if (profileDto.emergencyContactPhone !== undefined)
      profile.emergencyContactPhone = profileDto.emergencyContactPhone;

    try {
      return manager.save(profile);
    } catch {
      throw new HttpException("Error al actualizar el perfil del paciente", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async softRemove(userId: string, businessId: string, manager: EntityManager): Promise<void> {
    const profile = await manager.findOne(PatientProfile, { where: { userId, businessId } });
    if (!profile) throw new HttpException("Perfil de paciente no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.softRemove(profile);
    } catch {
      throw new HttpException("Error al eliminar el perfil del paciente", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
