import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ApiKey } from "@api-keys/entities/api-key.entity";
import { ApiKeysController } from "@api-keys/api-keys.controller";
import { ApiKeysService } from "@api-keys/api-keys.service";

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
})
export class ApiKeysModule {}
