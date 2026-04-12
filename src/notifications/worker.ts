// src/notifications/worker.ts
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";
import { Worker } from "bullmq";
import { EmailService } from "./email/email.service";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);

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
        host: "127.0.0.1",
        port: 6379,
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
