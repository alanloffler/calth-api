import type { Request } from "express";
import { ConfigService } from "@nestjs/config";
import { ExtractJwt, Strategy } from "passport-jwt";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";

import type { IPayload } from "@auth/interfaces/payload.interface";
import { UsersService } from "@users/users.service";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>("JWT_REFRESH_SECRET");
    if (!secret) throw new HttpException("JWT_REFRESH_SECRET no está definido", HttpStatus.UNAUTHORIZED);

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: IPayload): Promise<IPayload> {
    try {
      if (!payload) throw new HttpException("Token invalido", HttpStatus.UNAUTHORIZED);

      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) throw new HttpException("Token de refresco no encontrado", HttpStatus.UNAUTHORIZED);

      const user = payload.isSuperAdmin
        ? await this.usersService.findOneWithTokenGlobal(payload.id)
        : await this.usersService.findOneWithToken(payload.id, payload.businessId);

      const storedRefreshToken = user.data?.refreshToken;
      if (storedRefreshToken !== refreshToken)
        throw new HttpException("Token de refresco no válido", HttpStatus.UNAUTHORIZED);

      return payload;
    } catch (error) {
      throw new HttpException("Error al validar el token de refresco", HttpStatus.UNAUTHORIZED);
    }
  }
}
