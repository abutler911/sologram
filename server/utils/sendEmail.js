// utils/sendEmail.js
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

const mailerSend = new MailerSend({
  apiKey: process.env.MAILSENDER_API_KEY,
});

const sender = new Sender('admin@thesologram.com', 'SoloGram Admin');

/**
 * Send an email using MailerSend
 * @param {Object} param0
 * @param {string} param0.to - Recipient email
 * @param {string} param0.subject - Subject of the email
 * @param {string} param0.html - HTML content of the email
 */
const sendEmail = async ({ to, subject, html }) => {
  const recipients = [new Recipient(to, to)];
  const emailParams = new EmailParams()
    .setFrom(sender)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(html);

  try {
    console.log('📤 Sending email to:', to);
    await mailerSend.email.send(emailParams);
    console.log('✅ Email sent to:', to);
  } catch (error) {
    console.error('❌ MailerSend error:', JSON.stringify(error, null, 2));
  }
};

module.exports = { sendEmail };
