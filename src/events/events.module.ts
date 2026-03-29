import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BusinessModule } from "@business/business.module";
import { Event } from "@events/entities/event.entity";
import { EventsController } from "@events/events.controller";
import { EventsService } from "@events/events.service";
import { Permission } from "@permissions/entities/permission.entity";
import { ProfessionalProfileModule } from "@professional-profile/professional-profile.module";
import { Role } from "@roles/entities/role.entity";
import { UsersModule } from "@users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, Permission, Role]),
    BusinessModule,
    ProfessionalProfileModule,
    UsersModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
