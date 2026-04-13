import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Queue } from "bullmq";

@Injectable()
export class NotificationsService {
  constructor(@InjectQueue("notifications") private readonly queue: Queue) {}

  @OnEvent("business.created")
  async businessCreatedEvent(payload: { email: string; companyName: string; companyLink: string }) {
    await this.queue.add(
      "send-email",
      {
        type: "business-created",
        ...payload,
      },
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
      },
    );
  }

  @OnEvent("event.created")
  async eventCreatedEvent(payload: {
    email: string;
    companyName: string;
    fullName: string;
    title: string;
    startDate: string;
  }) {
    await this.queue.add(
      "send-email",
      {
        type: "event-created",
        ...payload,
      },
      {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
      },
    );
  }
}
