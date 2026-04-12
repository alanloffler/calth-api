import sgMail from "@sendgrid/mail";

export class EmailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error("SENDGRID_API_KEY is not defined");
    }

    sgMail.setApiKey(apiKey);
  }

  async sendClinicCreatedEmail(to: string, clinicName: string) {
    await sgMail.send({
      to,
      from: "alanmatiasloffler@gmail.com",
      subject: "Clínica creada",
      html: `<h1>Tu clínica ${clinicName} fue creada</h1>`,
    });
  }
}
