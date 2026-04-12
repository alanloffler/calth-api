import sgMail from "@sendgrid/mail";
import { ConfigService } from "@nestjs/config";
import { Injectable } from "@nestjs/common";

@Injectable()
export class EmailService {
  private readonly fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>("SENDGRID_API_KEY");
    this.fromEmail = this.configService.getOrThrow<string>("SENDGRID_FROM_EMAIL");

    sgMail.setApiKey(apiKey);
  }

  async sendClinicCreatedEmail(to: string, clinicName: string) {
    await sgMail.send({
      to,
      from: this.fromEmail,
      subject: "Clínica creada",
      html: `<h1>Tu clínica ${clinicName} fue creada</h1>`,
    });
  }
}
