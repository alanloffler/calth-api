import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { jwtDecode } from "jwt-decode";

import type { IPayload } from "@auth/interfaces/payload.interface";

export const BusinessId = createParamDecorator((_: unknown, ctx: ExecutionContext): string | undefined => {
  const request = ctx.switchToHttp().getRequest();
  const token = request.cookies?.access_token;

  if (!token) return undefined;

  const payload: IPayload = jwtDecode(token);

  return payload.businessId;
});
