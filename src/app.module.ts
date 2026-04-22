import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@auth/auth.module";
import { BlockedDaysModule } from "@blocked-days/blocked-days.module";
import { BusinessModule } from "@business/business.module";
import { CacheConfigModule } from "@config/cache-config.module";
import { EventsModule } from "@events/events.module";
import { MedicalHistoryModule } from "@medical-history/medical-history.module";
import { NotificationsModule } from "@notifications/notifications.module";
import { PatientProfileModule } from "@patient-profile/patient-profile.module";
import { PermissionsModule } from "@permissions/permissions.module";
import { ProfessionalProfileModule } from "@professional-profile/professional-profile.module";
import { RolesModule } from "@roles/roles.module";
import { SettingsModule } from "@settings/settings.module";
import { UsersModule } from "@users/users.module";
import { typeOrmConfig } from "@config/typeorm.config";

@Module({
  imports: [
    CacheConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("REDIS_HOST"),
          port: configService.get<number>("REDIS_PORT"),
        },
      }),
      inject: [ConfigService],
    }),
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      autoLoadEntities: true,
    }),
    AuthModule,
    BlockedDaysModule,
    BusinessModule,
    EventsModule,
    MedicalHistoryModule,
    NotificationsModule,
    PatientProfileModule,
    PermissionsModule,
    ProfessionalProfileModule,
    RolesModule,
    SettingsModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
