import nodemailer from 'nodemailer';

let transporter;

function getTransport() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  return transporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const instance = getTransport();

  if (!instance || !to) {
    return { skipped: true, sent: false };
  }

  await instance.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });

  return { skipped: false, sent: true };
}

export async function sendResultEmails(recipients, subject, html) {
  const uniqueRecipients = [...new Set(recipients.filter(Boolean).map((value) => String(value).trim().toLowerCase()))];

  if (uniqueRecipients.length === 0) {
    return { skipped: true, sent: 0, failed: 0 };
  }

  const deliveries = await Promise.allSettled(
    uniqueRecipients.map((recipient) => sendEmail({ to: recipient, subject, html }))
  );

  return {
    skipped: false,
    sent: deliveries.filter((item) => item.status === 'fulfilled').length,
    failed: deliveries.filter((item) => item.status === 'rejected').length,
  };
}