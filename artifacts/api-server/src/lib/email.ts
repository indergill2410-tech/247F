import { config } from "../config/index.js";
import { logger } from "./logger.js";

interface WelcomeEmailData {
  name: string;
  email: string;
}

interface OtpEmailData {
  name: string;
  email: string;
  otp: string;
}

async function sendViaApi(payload: object): Promise<void> {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.sendgrid.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SendGrid error ${res.status}: ${text}`);
  }
}

function guard(templateId: string, label: string): boolean {
  if (!config.sendgrid.enabled) {
    logger.warn({ label }, "Email skipped — SendGrid not configured");
    return false;
  }
  if (!templateId) {
    logger.warn({ label }, "Email skipped — template ID not configured");
    return false;
  }
  return true;
}

export async function sendCustomerWelcome(data: WelcomeEmailData): Promise<void> {
  const tid = config.sendgrid.templates.customerWelcome;
  if (!guard(tid, "customerWelcome")) return;
  try {
    await sendViaApi({
      personalizations: [{ to: [{ email: data.email }], dynamic_template_data: { name: data.name } }],
      from: { email: config.sendgrid.fromEmail, name: "Fixit 24/7" },
      template_id: tid,
    });
    logger.info({ email: data.email }, "Customer welcome email sent");
  } catch (err) {
    logger.error({ err, email: data.email }, "Failed to send customer welcome email");
  }
}

export async function sendTradieWelcome(data: WelcomeEmailData): Promise<void> {
  const tid = config.sendgrid.templates.tradieWelcome;
  if (!guard(tid, "tradieWelcome")) return;
  try {
    await sendViaApi({
      personalizations: [{ to: [{ email: data.email }], dynamic_template_data: { name: data.name } }],
      from: { email: config.sendgrid.fromEmail, name: "Fixit 24/7" },
      template_id: tid,
    });
    logger.info({ email: data.email }, "Tradie welcome email sent");
  } catch (err) {
    logger.error({ err, email: data.email }, "Failed to send tradie welcome email");
  }
}

export async function sendOtp(data: OtpEmailData): Promise<void> {
  const tid = config.sendgrid.templates.otp;
  if (!guard(tid, "otp")) return;
  try {
    await sendViaApi({
      personalizations: [{ to: [{ email: data.email }], dynamic_template_data: { name: data.name, otp: data.otp } }],
      from: { email: config.sendgrid.fromEmail, name: "Fixit 24/7" },
      template_id: tid,
    });
    logger.info({ email: data.email }, "OTP email sent");
  } catch (err) {
    logger.error({ err, email: data.email }, "Failed to send OTP email");
  }
}
