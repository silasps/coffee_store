import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendDeveloperAlert(subject: string, html: string) {
  const to = process.env.DEVELOPER_EMAIL;
  if (!to || !process.env.SMTP_HOST) return;

  await transporter.sendMail({
    from: `"Sistema Café AT" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
