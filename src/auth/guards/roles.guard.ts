import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { ERole } from "@common/enums/role.enum";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles: ERole[] = this.reflector.getAllAndOverride<ERole[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();

    if (user?.isSuperAdmin) return true;

    const roleExists: boolean = requiredRoles.some((role) => user.role === role);

    if (!roleExists) {
      throw new HttpException(`El usuario ${user.email} no posee un rol permitido`, HttpStatus.FORBIDDEN);
    }

    return true;
  }
}
