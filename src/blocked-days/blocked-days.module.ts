import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BlockedDay } from "@blocked-days/entities/blocked-day.entity";
import { BlockedDaysController } from "@blocked-days/blocked-days.controller";
import { BlockedDaysService } from "@blocked-days/blocked-days.service";

@Module({
  imports: [TypeOrmModule.forFeature([BlockedDay])],
  controllers: [BlockedDaysController],
  providers: [BlockedDaysService],
})
export class BlockedDaysModule {}
