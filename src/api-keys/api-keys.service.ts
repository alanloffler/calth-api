import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApiKey } from "@api-keys/entities/api-key.entity";
import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreateApiKeyDto } from "@api-keys/dto/create-api-key.dto";
import { UpdateApiKeyDto } from "@api-keys/dto/update-api-key.dto";

@Injectable()
export class ApiKeysService {
  constructor(@InjectRepository(ApiKey) private readonly apiKeyRepository: Repository<ApiKey>) {}

  async create(businessId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiResponse<ApiKey>> {
    // TODO: handle duplicated try-catch -> err 23505
    const apiKey = this.apiKeyRepository.create({
      name: createApiKeyDto.name,
      key: createApiKeyDto.key,
    });
    const newApiKey = await this.apiKeyRepository.save({ ...apiKey, businessId });
    if (!newApiKey) throw new HttpException("Error al crear API key", HttpStatus.INTERNAL_SERVER_ERROR);

    return ApiResponse.created<ApiKey>("API key creada", newApiKey);
  }

  async findAll(businessId: string): Promise<ApiResponse<ApiKey[]>> {
    console.log(businessId);
    const apiKeys = await this.apiKeyRepository.find({
      where: { businessId },
      order: { name: "ASC" },
    });
    if (!apiKeys) throw new HttpException("Error al obtener las API keys", HttpStatus.NOT_FOUND);

    return ApiResponse.success<ApiKey[]>("API keys encontradas", apiKeys);
  }

  async update(businessId: string, id: string, updateApiKeyDto: UpdateApiKeyDto): Promise<ApiResponse<void>> {
    const updatedApiKey = await this.apiKeyRepository.update({ id, businessId }, updateApiKeyDto);
    if (!updatedApiKey) throw new HttpException("Error al actualizar API key", HttpStatus.INTERNAL_SERVER_ERROR);
    if (updatedApiKey.affected === 0) throw new HttpException("API key no encontrada", HttpStatus.NOT_FOUND);

    return ApiResponse.success<void>("API key actualizada", undefined);
  }

  remove(id: number) {
    return `This action removes a #${id} apiKey`;
  }
}
