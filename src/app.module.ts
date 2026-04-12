import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@auth/auth.module";
import { BusinessModule } from "@business/business.module";
import { CacheConfigModule } from "@config/cache-config.module";
import { EventsModule } from "@events/events.module";
import { MedicalHistoryModule } from "@medical-history/medical-history.module";
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
    EventEmitterModule.forRoot(),
    TypeOrmModule.forRoot({
      ...typeOrmConfig,
      autoLoadEntities: true,
    }),
    AuthModule,
    BusinessModule,
    EventsModule,
    MedicalHistoryModule,
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
