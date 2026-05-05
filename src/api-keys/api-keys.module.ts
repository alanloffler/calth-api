import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApiKey } from "@api-keys/entities/api-key.entity";
import { ApiKeysController } from "@api-keys/api-keys.controller";
import { ApiKeysService } from "@api-keys/api-keys.service";
import { EncryptionService } from "@common/services/encryption.service";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService, EncryptionService],
})
export class ApiKeysModule {}
