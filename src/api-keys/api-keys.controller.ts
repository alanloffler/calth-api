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
  findAll(@BusinessId(ParseUUIDPipe) businessId: string) {
    return this.apiKeysService.findAll(businessId);
  }

  @Patch(":id")
  update(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("id") id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(businessId, id, updateApiKeyDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.apiKeysService.remove(+id);
  }
}
