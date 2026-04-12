import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Queue } from "bullmq";

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue("notifications") private readonly queue: Queue) {}

  // TODO: implement notifications on events
  // TODO: implement notifications on users
  @OnEvent("clinic.created")
  async handleClinicCreatedEvent(payload: { email: string; clinicName: string }) {
    await this.queue.add("send-email", {
      type: "clinic-created",
      ...payload,
    });
  }
}
