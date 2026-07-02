#!/usr/bin/env node

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.EMAIL_FROM_ADDRESS?.trim();
const testEmail = process.env.TEST_EMAIL?.trim();

if (!apiKey || !from || !testEmail) {
  console.error(
    "Missing RESEND_API_KEY, EMAIL_FROM_ADDRESS, or TEST_EMAIL in the local env.",
  );
  process.exit(1);
}

const response = await fetch("https://api.resend.com/emails", {
  body: JSON.stringify({
    from,
    html: `<p>Your afterservice email path is connected.</p><p>TEST_EMAIL override is active in local/dev mode.</p>`,
    subject: "afterservice test email",
    to: [testEmail],
  }),
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  method: "POST",
});
const payload = await response.json().catch(() => null);

if (!response.ok || payload?.error) {
  console.error(
    "Failed to send test email:",
    payload?.error ?? response.statusText,
  );
  process.exit(1);
}

console.log(`Sent test email to TEST_EMAIL (${testEmail}).`);
if (payload?.id) {
  console.log(`Provider id: ${payload.id}`);
}
