import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";

import { AuthController } from "@auth/auth.controller";
import { AuthService } from "@auth/auth.service";
import { BusinessModule } from "@business/business.module";
import { JwtRefreshStrategy } from "@auth/strategies/jwt-refresh.strategy";
import { JwtStrategy } from "@auth/strategies/jwt.strategy";
import { LocalStrategy } from "@auth/strategies/local.strategy";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { UsersModule } from "@users/users.module";

@Module({
  imports: [
    CacheModule.register({
      ttl: 0,
      max: 1000,
    }),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: configService.get<any>("JWT_EXPIRES_IN") || "7d",
        },
      }),
    }),
    BusinessModule,
    PassportModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, LocalStrategy, PermissionsGuard],
  exports: [PermissionsGuard],
})
export class AuthModule {}
