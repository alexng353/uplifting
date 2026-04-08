const MAILGUN_API_KEY = process.env.MAILGUN_API_KEY!;
const MAILGUN_DOMAIN = process.env.MAILGUN_DOMAIN!;
const MAILGUN_BASE_URL = process.env.MAILGUN_BASE_URL!;
const MAILGUN_FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL!;

export async function sendEmail(to: string, subject: string, text: string) {
  const form = new FormData();
  form.append("from", MAILGUN_FROM_EMAIL);
  form.append("to", to);
  form.append("subject", subject);
  form.append("text", text);

  const response = await fetch(
    `${MAILGUN_BASE_URL}/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
      },
      body: form,
    },
  );

  if (!response.ok) {
    throw new Error(
      `Mailgun error: ${response.status} ${await response.text()}`,
    );
  }
}

export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
