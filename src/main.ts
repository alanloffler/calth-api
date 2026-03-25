import cookieParser from "cookie-parser";
import path from "path";
import { BadRequestException, ClassSerializerInterceptor, ValidationError, ValidationPipe } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { NestFactory, Reflector } from "@nestjs/core";
import { existsSync, readFileSync } from "fs";

import { AppModule } from "@/app.module";
import { flattenErrors } from "@common/validators/flatten-errors.validator";
import { getAllowedPatterns } from "@common/helpers/domain-patterns.helper";

async function bootstrap() {
  const isDev = process.env.NODE_ENV === "development";

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined = undefined;

  if (isDev) {
    const certPath = path.resolve(__dirname, "../../../certs");
    const keyPath = path.join(certPath, "localhost-key.pem");
    const certFilePath = path.join(certPath, "localhost.pem");

    if (existsSync(keyPath) && existsSync(certFilePath)) {
      httpsOptions = {
        key: readFileSync(keyPath),
        cert: readFileSync(certFilePath),
      };
    } else {
      console.warn("Certificate files not found. Running in non-secure mode.");
    }
  }

  const PORT: number = parseInt(process.env.PORT ?? "3000");

  const app = await NestFactory.create<NestExpressApplication>(AppModule, { httpsOptions });
  app.enableCors({
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    origin: (origin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
      if (!origin) return callback(null, true);

      const isAllowed = getAllowedPatterns().some((p) => p.test(origin));
      callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
    },
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          errors: flattenErrors(errors),
        });
      },
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(PORT);
}

bootstrap();
