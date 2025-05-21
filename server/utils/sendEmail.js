// utils/sendEmail.js
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from "dotenv";
dotenv.config();

const mailerSend = new MailerSend({
  apiKey: process.env.MAILSENDER_API_KEY,
});

const sender = new Sender("admin@thesologram.com", "SoloGram Admin");

/**
 * Send an email using MailerSend
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Subject of the email
 * @param {string} param0.html - HTML content of the email
 */
export const sendEmail = async ({ to, subject, html }) => {
  const recipients = [new Recipient(to, to)];

  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(html);

  try {
    await mailerSend.email.send(emailParams);
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error(
      "❌ Error sending email:",
      error.response?.body || error.message
    );
  }
};
