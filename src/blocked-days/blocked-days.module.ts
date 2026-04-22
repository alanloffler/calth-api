import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { BlockedDaysController } from "@blocked-days/blocked-days.controller";
import { BlockedDaysService } from "@blocked-days/blocked-days.service";
import { Role } from "@roles/entities/role.entity";

@Module({
  imports: [TypeOrmModule.forFeature([BlockedDay, Role])],
  controllers: [BlockedDaysController],
  providers: [BlockedDaysService],
})
export class BlockedDaysModule {}
