import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { notificationsQueue } from "./queue";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  @OnEvent("clinic.created")
  async handleClinicCreatedEvent(payload: { email: string; clinicName: string }) {
    this.logger.log(`clinic.created event received for ${payload.email}`);
    const job = await notificationsQueue.add("send-email", {
      type: "clinic-created",
      ...payload,
    });
    this.logger.log(`Job ${job.id} added to queue`);
  }
}
