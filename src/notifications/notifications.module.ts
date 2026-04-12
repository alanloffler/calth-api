import { Module } from "@nestjs/common";

import { EmailService } from "@notifications/email/email.service";
import { NotificationsService } from "@notifications/notifications.service";

@Module({
  providers: [NotificationsService, EmailService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
