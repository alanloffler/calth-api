import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from "@nestjs/common";

import { ApiKeysService } from "@api-keys/api-keys.service";
import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreateApiKeyDto } from "@api-keys/dto/create-api-key.dto";
import { UpdateApiKeyDto } from "@api-keys/dto/update-api-key.dto";

@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@BusinessId(ParseUUIDPipe) businessId: string, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.create(businessId, createApiKeyDto);
  }

  @Get()
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.apiKeysService.findOne(+id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeysService.update(+id, updateApiKeyDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.apiKeysService.remove(+id);
  }
}
