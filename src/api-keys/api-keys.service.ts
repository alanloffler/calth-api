import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApiKey } from "@api-keys/entities/api-key.entity";
import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreateApiKeyDto } from "@api-keys/dto/create-api-key.dto";
import { EncryptionService } from "@common/services/encryption.service";
import { UpdateApiKeyDto } from "@api-keys/dto/update-api-key.dto";

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private readonly apiKeyRepository: Repository<ApiKey>,
    private readonly encryptionService: EncryptionService,
  ) {}

  async create(businessId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiResponse<ApiKey>> {
    try {
      const apiKey = this.apiKeyRepository.create({
        name: createApiKeyDto.name,
        key: this.encryptionService.encrypt(createApiKeyDto.key),
        linkedTo: createApiKeyDto.linkedTo,
        active: createApiKeyDto.active,
      });
      const newApiKey = await this.apiKeyRepository.save({ ...apiKey, businessId });

      return ApiResponse.created<ApiKey>("API key creada", newApiKey);
    } catch (error: any) {
      if (error?.driverError?.code === "23505") {
        throw new HttpException("API key duplicada", HttpStatus.CONFLICT);
      }
      throw new HttpException("Error al crear API key", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(businessId: string): Promise<ApiResponse<ApiKey[]>> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { businessId },
      order: { name: "ASC" },
    });

    const decryptedApiKeys = apiKeys.map((apiKey) => {
      try {
        return {
          ...apiKey,
          key: this.encryptionService.decrypt(apiKey.key).slice(0, 15) + "...",
        };
      } catch {
        return { ...apiKey, key: apiKey.key };
      }
    });

    return ApiResponse.success<ApiKey[]>("API keys encontradas", decryptedApiKeys);
  }

  async update(businessId: string, id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiResponse<void>> {
    try {
      const dto = { ...updateApiKeyDto };
      if (dto.key) {
        dto.key = this.encryptionService.encrypt(dto.key);
      }

      const updatedApiKey = await this.apiKeyRepository.update({ id, businessId }, dto);
      if (updatedApiKey.affected === 0) throw new HttpException("API key no encontrada", HttpStatus.NOT_FOUND);

      return ApiResponse.success<void>("API key actualizada", undefined);
    } catch (error: any) {
      if (error instanceof HttpException) throw error;
      if (error?.driverError?.code === "23505") {
        throw new HttpException("API key duplicada", HttpStatus.CONFLICT);
      }
      throw new HttpException("Error al actualizar API key", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(businessId: string, id: string): Promise<ApiResponse<void>> {
    const result = await this.apiKeyRepository.delete({ id, businessId });
    if (!result) throw new HttpException("Error al eliminar API key", HttpStatus.INTERNAL_SERVER_ERROR);
    if (result.affected === 0) throw new HttpException("API key no encontrada", HttpStatus.NOT_FOUND);

    return ApiResponse.success<void>("API key eliminada", undefined);
  }
}
