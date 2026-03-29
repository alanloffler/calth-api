import { EntityManager, Repository } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { CreateProfessionalProfileDto } from "@professional-profile/dto/create-professional-profile.dto";
import { ProfessionalProfile } from "@professional-profile/entities/professional-profile.entity";
import { UpdateProfessionalProfileDto } from "@professional-profile/dto/update-professional-profile.dto";

@Injectable()
export class ProfessionalProfileService {
  constructor(
    @InjectRepository(ProfessionalProfile) private readonly professionalRepository: Repository<ProfessionalProfile>,
  ) {}

  async create(
    profileDto: CreateProfessionalProfileDto,
    userId: string,
    businessId: string,
    manager: EntityManager,
  ): Promise<ProfessionalProfile> {
    const existingLicense = await manager.findOne(ProfessionalProfile, {
      where: { licenseId: profileDto.licenseId },
    });
    if (existingLicense) throw new HttpException("Matrícula ya registrada", HttpStatus.BAD_REQUEST);

    const profile = manager.create(ProfessionalProfile, {
      ...profileDto,
      userId,
      businessId,
    });

    try {
      return manager.save(profile);
    } catch {
      throw new HttpException("Error al crear el perfil del profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Without EP, used on events -> check recurrents
  async findByUserId(userId: string, businessId: string): Promise<ProfessionalProfile | null> {
    const profile = await this.professionalRepository.findOne({ where: { businessId, userId } });
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);
    return profile;
  }

  async update(
    userId: string,
    businessId: string,
    profileDto: UpdateProfessionalProfileDto,
    manager: EntityManager,
  ): Promise<void> {
    const profile = await manager.findOne(ProfessionalProfile, { where: { businessId, userId } });
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

    if (profileDto.licenseId !== undefined && profileDto.licenseId !== profile.licenseId) {
      const existingLicense = await manager.findOne(ProfessionalProfile, {
        where: { licenseId: profileDto.licenseId },
      });
      if (existingLicense) throw new HttpException("Matrícula ya registrada", HttpStatus.BAD_REQUEST);

      profile.licenseId = profileDto.licenseId;
    }

    if (profileDto.professionalPrefix !== undefined) profile.professionalPrefix = profileDto.professionalPrefix;
    if (profileDto.specialty !== undefined) profile.specialty = profileDto.specialty;
    if (profileDto.workingDays !== undefined) profile.workingDays = profileDto.workingDays;
    if (profileDto.startHour !== undefined) profile.startHour = profileDto.startHour;
    if (profileDto.endHour !== undefined) profile.endHour = profileDto.endHour;
    if (profileDto.slotDuration !== undefined) profile.slotDuration = profileDto.slotDuration;
    if (profileDto.dailyExceptionStart !== undefined) profile.dailyExceptionStart = profileDto.dailyExceptionStart;
    if (profileDto.dailyExceptionEnd !== undefined) profile.dailyExceptionEnd = profileDto.dailyExceptionEnd;

    try {
      await manager.save(profile);
    } catch {
      throw new HttpException("Error al actualizar el perfil del profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async softRemove(userId: string, businessId: string, manager: EntityManager): Promise<void> {
    const profile = await manager.findOne(ProfessionalProfile, { where: { userId, businessId } });
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.softRemove(profile);
    } catch {
      throw new HttpException("Error al eliminar el perfil del profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(userId: string, businessId: string, manager: EntityManager): Promise<void> {
    const profile = await manager.findOne(ProfessionalProfile, { where: { userId, businessId } });
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.remove(profile);
    } catch {
      throw new HttpException("Error al eliminar el perfil del profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(userId: string, businessId: string, manager: EntityManager): Promise<void> {
    const profile = await manager.findOne(ProfessionalProfile, { where: { businessId, userId }, withDeleted: true });
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.restore(ProfessionalProfile, profile.id);
    } catch {
      throw new HttpException("Error al restaurar el perfil del profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
