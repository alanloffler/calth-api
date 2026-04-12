import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { NotificationsService } from "@notifications/notifications.service";

@Module({
  imports: [BullModule.registerQueue({ name: "notifications" })],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
