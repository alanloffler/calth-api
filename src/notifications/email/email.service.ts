import sgMail from "@sendgrid/mail";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";
import { join } from "path";
import { readFileSync } from "fs";

@Injectable()
export class EmailService {
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>("SENDGRID_API_KEY");
    this.fromEmail = this.configService.getOrThrow<string>("SENDGRID_FROM_EMAIL");

    sgMail.setApiKey(apiKey);
  }

  async sendBusinessCreatedEmail(to: string, companyName: string, companyLink: string) {
    await sgMail.send({
      to,
      from: this.fromEmail,
      subject: "Calth - Alta de negocio",
      html: this.renderTemplate("business-created", { companyName, companyLink }),
    });
  }

  async sendEventCreatedEmail(
    to: string,
    data: { companyName: string; userName: string; title: string; startDate: string },
  ) {
    await sgMail.send({
      to,
      from: this.fromEmail,
      subject: "Calth - Turno creado",
      html: this.renderTemplate("event-created", data),
    });
  }

  private renderTemplate(name: string, data: Record<string, string>): string {
    const filePath = join(__dirname, "templates", `${name}.html`);
    let html = readFileSync(filePath, "utf-8");
    for (const [key, value] of Object.entries(data)) {
      html = html.replaceAll(`{{${key}}}`, value);
    }
    return html;
  }
}
