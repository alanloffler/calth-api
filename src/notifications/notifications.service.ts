import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

import { notificationsQueue } from "@notifications/queue";

@Injectable()
export class NotificationsService {
  @OnEvent("clinic.created")
  async handleClinicCreatedEvent(payload: { email: string; clinicName: string }) {
    await notificationsQueue.add("send-email", {
      type: "clinic-created",
      ...payload,
    });
  }
}
