import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { Worker } from "bullmq";

import { EmailService } from "@notifications/email/email.service";
import { WorkerModule } from "@notifications/worker.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  const configService = app.get(ConfigService);
  const emailService = app.get(EmailService);

  const worker = new Worker(
    "notifications",
    async (job) => {
      if (job.name === "send-email") {
        const { type, email, clinicName } = job.data;

        if (type === "clinic-created") {
          await emailService.sendClinicCreatedEmail(email, clinicName);
        }
      }
    },
    {
      connection: {
        host: configService.get<string>("REDIS_HOST"),
        port: configService.get<number>("REDIS_PORT"),
      },
    },
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} (${job.name}) completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job?.id} (${job?.name}) failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker error:", err);
  });

  console.log("[Worker] Started, waiting for jobs...");
}

bootstrap();
