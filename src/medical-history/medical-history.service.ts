import { InjectRepository } from "@nestjs/typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreateMedicalHistoryDto } from "@medical-history/dto/create-medical-history.dto";
import { MedicalHistory } from "@medical-history/entities/medical-history.entity";
import { UpdateMedicalHistoryDto } from "@medical-history/dto/update-medical-history.dto";

@Injectable()
export class MedicalHistoryService {
  constructor(
    @InjectRepository(MedicalHistory) private readonly medicalHistoryRepository: Repository<MedicalHistory>,
  ) {}

  async create(
    businessId: string,
    createMedicalHistoryDto: CreateMedicalHistoryDto,
  ): Promise<ApiResponse<MedicalHistory>> {
    // TODO:
    // 1. Check userId existence
    // 2. Check eventId existence
    const { eventId, ...rest } = createMedicalHistoryDto;
    const createDto = { ...rest, businessId, ...(eventId && { eventId }) };

    if (eventId) {
      console.log("there's eventId, then check existence");
    } else {
      console.log("there's no eventId");
    }

    const history = this.medicalHistoryRepository.create(createDto);
    const saveHistory = await this.medicalHistoryRepository.save(history);
    if (!saveHistory) throw new HttpException("Error al crear el la historia médica", HttpStatus.BAD_REQUEST);

    return ApiResponse.created<MedicalHistory>("Historial creado", history);
  }

  // Find all medical histories for business
  async findAll(businessId: string): Promise<ApiResponse<MedicalHistory[]>> {
    // TODO: check businessId???
    // TODO: user & event relation if needed
    const histories = await this.medicalHistoryRepository.find({ where: { businessId } });
    if (!histories) throw new HttpException("Error al obtener los historiales", HttpStatus.NOT_FOUND);

    return ApiResponse.success<MedicalHistory[]>("Historiales encontrados", histories);
  }

  // Find all medical histories for business and patient
  async findAllByPatient(businessId: string, userId: string): Promise<ApiResponse<MedicalHistory[]>> {
    // TODO: check businessId & userId???
    // TODO: user & event relation if needed
    const histories = await this.medicalHistoryRepository.find({
      where: { businessId, userId },
      order: { date: "DESC" },
      relations: ["user"],
    });
    if (!histories) throw new HttpException("Error al obtener el historial médico", HttpStatus.NOT_FOUND);

    return ApiResponse.success<MedicalHistory[]>("Historial médico encontrado", histories);
  }

  async findOne(businessId: string, id: string): Promise<ApiResponse<MedicalHistory>> {
    // TODO: check businessId???
    // TODO: user & event relation if needed
    const history = await this.medicalHistoryRepository.findOne({
      where: { id, businessId },
    });
    if (!history) throw new HttpException("Historial no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<MedicalHistory>("Historial encontrado", history);
  }

  async update(
    id: string,
    businessId: string,
    updateMedicalHistoryDto: UpdateMedicalHistoryDto,
  ): Promise<ApiResponse<void>> {
    const history = await this.medicalHistoryRepository.update({ id, businessId }, updateMedicalHistoryDto);
    if (history.affected === 0) throw new HttpException("Error al actualizar el historial", HttpStatus.BAD_REQUEST);

    return ApiResponse.success("Historia médica actualizada");
  }

  async softRemove(id: string, businessId: string): Promise<ApiResponse<void>> {
    const history = await this.medicalHistoryRepository.softDelete({ id, businessId });
    if (history.affected === 0) throw new HttpException("Error al eliminar el historial", HttpStatus.BAD_REQUEST);

    return ApiResponse.success("Historia médica eliminada");
  }

  async restore(id: string, businessId: string): Promise<ApiResponse<void>> {
    const history = await this.medicalHistoryRepository.restore({ id, businessId });
    if (history.affected === 0) throw new HttpException("Error al restaurar el historial", HttpStatus.BAD_REQUEST);

    return ApiResponse.success("Historia médica restaurada");
  }

  remove(id: string) {
    return `This action removes a #${id} medicalHistory`;
  }
}
