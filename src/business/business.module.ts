import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Business } from "@business/entities/business.entity";
import { BusinessController } from "@business/business.controller";
import { BusinessService } from "@business/business.service";
import { CreateBusinessWithAdminUseCase } from "@business/use-cases/create-business-with-admin.use-case";
import { Permission } from "@permissions/entities/permission.entity";
import { Role } from "@roles/entities/role.entity";
import { UsersModule } from "@users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Business, Permission, Role]), UsersModule],
  controllers: [BusinessController],
  providers: [BusinessService, CreateBusinessWithAdminUseCase],
  exports: [BusinessService],
})
export class BusinessModule {}
