import type { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import type { IPayload } from "@auth/interfaces/payload.interface";
import { User } from "@users/entities/user.entity";
import { UsersService } from "@users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    if (!secret) throw new Error("JWT_SECRET no está definido");

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: IPayload) {
    const user = await this.usersService.findOne(payload.id, payload.businessId);
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.UNAUTHORIZED);

    return {
      businessId: (user.data as User)?.businessId,
      id: user.data?.id,
      email: user.data?.email,
      role: user.data?.role.value,
      roleId: user.data?.role.id,
      type: payload.type,
    };
  }
}
