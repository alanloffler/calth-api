import type { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import type { IPayload } from "@auth/interfaces/payload.interface";
import type { IRequest } from "@auth/interfaces/request.interface";
import type { IToken } from "@auth/interfaces/token.interface";
import { ApiResponse } from "@common/helpers/api-response.helper";
import { UsersService } from "@users/users.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async signIn(req: IRequest, res: Response): Promise<ApiResponse<null>> {
    const payload = {
      businessId: req.user.businessId,
      id: req.user.id,
      isSuperAdmin: req.user.isSuperAdmin,
      email: req.user.email,
      role: req.user.role,
      roleId: req.user.roleId,
    };

    const tokens = await this.getTokens(payload, true);

    await this.updateRefreshToken(payload.id, tokens.refreshToken!);

    this.setTokenCookie(res, tokens);

    return ApiResponse.success("Usuario logueado");
  }

  // async validateUser(email: string): Promise<IPayload> {
  // const user = await this.adminService.findOneByEmail(email);
  //
  // if (!user) throw new HttpException("Usuario incorrecto", HttpStatus.NOT_FOUND);
  // if (!user.role) throw new HttpException("El usuario posee un rol inactivo", HttpStatus.NOT_FOUND);
  //
  // return {
  //   businessId: user.businessId,
  //   id: user.id,
  //   email: user.email,
  //   role: user.role.value,
  //   roleId: user.role.id,
  // };
  // }

  // async validatePassword(email: string, password: string): Promise<boolean> {
  //   const user = await this.adminService.findOneByEmail(email);
  //
  //   if (!user) throw new HttpException("Usuario incorrecto", HttpStatus.BAD_REQUEST);
  //
  //   const isPasswordValid = await bcrypt.compare(password, user.password);
  //   if (!isPasswordValid) throw new HttpException("Contraseña incorrecta", HttpStatus.UNAUTHORIZED);
  //
  //   return true;
  // }

  async getTokens(payload: IPayload, includeRefresh: boolean = true): Promise<IToken> {
    const sanitizedPayload: IPayload = { ...payload };
    delete sanitizedPayload.exp;
    delete sanitizedPayload.iat;

    try {
      const accessToken = await this.jwtService.signAsync(sanitizedPayload, {
        secret: this.configService.get<string>("JWT_SECRET"),
        expiresIn: this.configService.get("JWT_EXPIRES_IN"),
      });

      let refreshToken: string | undefined;

      if (includeRefresh) {
        refreshToken = await this.jwtService.signAsync(sanitizedPayload, {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn: this.configService.get("JWT_REFRESH_EXPIRES_IN"),
        });
      }

      return { accessToken, refreshToken };
    } catch (error) {
      throw new HttpException("Error al generar tokens", HttpStatus.BAD_REQUEST);
    }
  }

  async updateRefreshToken(id: string, refreshToken: string): Promise<void> {
    await this.usersService.setRefreshToken(id, refreshToken);
  }

  async signOut(payload: IPayload, res: Response): Promise<ApiResponse<null>> {
    await this.usersService.clearRefreshToken(payload.id);
    this.clearTokenCookie(res);

    return ApiResponse.success<null>("Deslogueo exitoso", null);
  }

  async refreshToken(payload: IPayload, refreshToken: string, res: Response) {
    const user = payload.isSuperAdmin
      ? await this.usersService.findOneWithTokenGlobal(payload.id)
      : await this.usersService.findOneWithToken(payload.id, payload.businessId);

    const storedRefreshToken = user?.data?.refreshToken;
    if (!storedRefreshToken) throw new HttpException("Token de actualización no existe", HttpStatus.BAD_REQUEST);

    if (storedRefreshToken !== refreshToken)
      throw new HttpException("Token de actualización inválido", HttpStatus.UNAUTHORIZED);

    const shouldRotate = false;

    const tokens = await this.getTokens(payload, shouldRotate);

    if (shouldRotate) {
      await this.updateRefreshToken(payload.id, tokens.refreshToken!);
    }

    this.setTokenCookie(res, {
      accessToken: tokens.accessToken,
      refreshToken: shouldRotate ? tokens.refreshToken : refreshToken,
    });

    return ApiResponse.success("Actualización de token exitosa", {
      accessToken: tokens.accessToken,
      refreshToken: shouldRotate ? tokens.refreshToken : refreshToken,
    });
  }

  async getMe(payload: IPayload) {
    const user = payload.isSuperAdmin
      ? await this.usersService.getUserGlobal(payload.id, payload.businessId)
      : await this.usersService.getUser(payload.id, payload.businessId);
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    if (payload.isSuperAdmin) user.businessId = payload.businessId;

    return ApiResponse.success("Usuario encontrado", { ...user, isSuperAdmin: payload.isSuperAdmin });
  }

  private setTokenCookie(res: Response, tokens: IToken): void {
    // const isProduction = this.configService.get("NODE_ENV") === "production";
    // const cookieOptions = {
    //   domain: isProduction ? `${this.configService.get("APP_DOMAIN")}` : ".lvh.me",
    //   httpOnly: true,
    //   path: "/",
    //   sameSite: isProduction ? ("none" as const) : ("lax" as const),
    //   secure: isProduction,
    // };

    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "none" as const,
      secure: true,
    };

    res.cookie("access_token", tokens.accessToken, {
      ...cookieOptions,
      maxAge: this.getMiliseconds(this.configService.get("JWT_EXPIRES_IN")),
    });

    res.cookie("refresh_token", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: this.getMiliseconds(this.configService.get("JWT_REFRESH_EXPIRES_IN")),
    });
  }

  private clearTokenCookie(res: Response): void {
    // const isProduction = this.configService.get("NODE_ENV") === "production";
    // const cookieOptions = {
    //   domain: isProduction ? `${this.configService.get("APP_DOMAIN")}` : ".lvh.me",
    //   httpOnly: true,
    //   maxAge: 0,
    //   path: "/",
    //   sameSite: isProduction ? ("none" as const) : ("lax" as const),
    //   secure: isProduction,
    // };

    const cookieOptions = {
      httpOnly: true,
      path: "/",
      sameSite: "none" as const,
      secure: true,
    };

    res.cookie("access_token", "", cookieOptions);
    res.cookie("refresh_token", "", cookieOptions);
  }

  private getMiliseconds(time: string | undefined): number {
    const match = time?.match(/(\d+)([smhd])/);
    if (!match) return 1000 * 60 * 60;

    const [_, value, unit] = match;
    switch (unit) {
      case "s":
        return parseInt(value) * 1000;
      case "m":
        return parseInt(value) * 1000 * 60;
      case "h":
        return parseInt(value) * 1000 * 60 * 60;
      case "d":
        return parseInt(value) * 1000 * 60 * 60 * 24;
      default:
        return 1000 * 60 * 60;
    }
  }
}
