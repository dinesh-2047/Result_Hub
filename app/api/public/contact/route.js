import { fail, ok } from '@/lib/api';
import { sendEmail } from '@/lib/mailer';

export async function POST(request) {
  const body = await request.json();
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const message = String(body.message || '').trim();

  if (!name || !email || !message) {
    return fail('Name, email, and message are required.', 400);
  }

  const destination = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  await sendEmail({
    to: destination,
    subject: `Portal contact from ${name}`,
    html: `
      <div>
        <h2>New contact request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br />')}</p>
      </div>
    `,
    text: `New contact request\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
  });

  return ok({ message: 'Message sent successfully.' });
}