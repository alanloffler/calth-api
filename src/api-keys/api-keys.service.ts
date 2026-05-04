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

  async create(businessId: string, createApiKeyDto: CreateApiKeyDto) {
    // TODO: handle duplicated try-catch -> err 23505
    const apiKey = this.apiKeyRepository.create({
      name: createApiKeyDto.name,
      key: createApiKeyDto.key,
    });
    const newApiKey = await this.apiKeyRepository.save({ ...apiKey, businessId });
    if (!newApiKey) throw new HttpException("Error al crear API key", HttpStatus.INTERNAL_SERVER_ERROR);

    return ApiResponse.created<ApiKey>("API key creada", newApiKey);
  }

  findAll() {
    return `This action returns all apiKeys`;
  }

  findOne(id: number) {
    return `This action returns a #${id} apiKey`;
  }

  update(id: number, updateApiKeyDto: UpdateApiKeyDto) {
    return `This action updates a #${id} apiKey`;
  }

  remove(id: number) {
    return `This action removes a #${id} apiKey`;
  }
}
