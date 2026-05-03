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

async function sendViaHtml(to: string, toName: string | undefined, subject: string, html: string): Promise<void> {
  if (!config.sendgrid.enabled) {
    logger.warn({ to }, "Email skipped — SendGrid not configured");
    return;
  }
  const body: Record<string, unknown> = {
    personalizations: [{ to: [toName ? { email: to, name: toName } : { email: to }] }],
    from: { email: config.sendgrid.fromEmail, name: "Fixit 24/7" },
    subject,
    content: [{ type: "text/html", value: html }],
  };
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.sendgrid.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SendGrid HTML email error ${res.status}: ${text}`);
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

function brandedHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0b0904;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0904;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#130f07;border:1px solid #1d1a12;border-radius:16px;overflow:hidden">
        <tr>
          <td style="background:#ffc800;padding:18px 28px">
            <span style="font-size:20px;font-weight:900;color:#000;letter-spacing:-0.5px">Fixit 24/7</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 28px 8px;color:#fff">
            <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;color:#fff">${title}</h2>
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px 28px;color:#ffffff55;font-size:12px;border-top:1px solid #1d1a12;margin-top:20px">
            <div style="border-top:1px solid #1d1a12;padding-top:20px">
              You're receiving this because you have an account on Fixit 24/7.<br>
              &copy; ${new Date().getFullYear()} Fixit 24/7. All rights reserved.
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

export async function sendNewClaimNotification(opts: {
  homeownerEmail: string;
  homeownerName: string;
  tradieName: string;
  jobTitle: string;
  jobId: number;
  proposedPrice?: number | null;
  message?: string | null;
}): Promise<void> {
  try {
    const priceRow = opts.proposedPrice
      ? `<p style="margin:0 0 8px;color:#ccc;font-size:15px">Proposed price: <strong style="color:#ffc800">$${opts.proposedPrice.toLocaleString()}</strong></p>`
      : "";
    const msgRow = opts.message
      ? `<p style="margin:12px 0 0;padding:12px;background:#1d1a12;border-radius:8px;color:#ccc;font-size:14px;font-style:italic">"${opts.message}"</p>`
      : "";
    const html = brandedHtml(
      "A Tradie Has Responded to Your Job",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.homeownerName},</p>
       <p style="margin:0 0 12px;color:#ccc;font-size:15px"><strong style="color:#fff">${opts.tradieName}</strong> has claimed your job <strong style="color:#fff">"${opts.jobTitle}"</strong>.</p>
       ${priceRow}${msgRow}
       <p style="margin:20px 0 0">
         <a href="${config.appUrl}/jobs/${opts.jobId}" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Review Their Offer →</a>
       </p>`,
    );
    await sendViaHtml(opts.homeownerEmail, opts.homeownerName, `New claim on "${opts.jobTitle}"`, html);
    logger.info({ email: opts.homeownerEmail, jobId: opts.jobId }, "New claim notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send new claim notification");
  }
}

export async function sendClaimAcceptedNotification(opts: {
  tradieEmail: string;
  tradieName: string;
  homeownerName: string;
  jobTitle: string;
  jobId: number;
}): Promise<void> {
  try {
    const html = brandedHtml(
      "Your Claim Was Accepted! 🎉",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.tradieName},</p>
       <p style="margin:0 0 12px;color:#ccc;font-size:15px">Great news — <strong style="color:#fff">${opts.homeownerName}</strong> has accepted your claim for <strong style="color:#fff">"${opts.jobTitle}"</strong>.</p>
       <p style="margin:0 0 20px;color:#ccc;font-size:15px">A conversation has been opened. Get in touch with the homeowner to confirm details and get started.</p>
       <p style="margin:0">
         <a href="${config.appUrl}/conversations" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Open Conversation →</a>
       </p>`,
    );
    await sendViaHtml(opts.tradieEmail, opts.tradieName, `Claim accepted for "${opts.jobTitle}"`, html);
    logger.info({ email: opts.tradieEmail, jobId: opts.jobId }, "Claim accepted notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send claim accepted notification");
  }
}

export async function sendNewMessageNotification(opts: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  jobTitle: string;
  conversationId: number;
}): Promise<void> {
  try {
    const html = brandedHtml(
      "You Have a New Message",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.recipientName},</p>
       <p style="margin:0 0 20px;color:#ccc;font-size:15px"><strong style="color:#fff">${opts.senderName}</strong> sent you a message about <strong style="color:#fff">"${opts.jobTitle}"</strong>.</p>
       <p style="margin:0">
         <a href="${config.appUrl}/conversations/${opts.conversationId}" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Read Message →</a>
       </p>`,
    );
    await sendViaHtml(opts.recipientEmail, opts.recipientName, `New message from ${opts.senderName}`, html);
    logger.info({ email: opts.recipientEmail, conversationId: opts.conversationId }, "New message notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send new message notification");
  }
}

export async function sendReviewReceivedNotification(opts: {
  tradieEmail: string;
  tradieName: string;
  reviewerName: string;
  rating: number;
  comment?: string | null;
  jobTitle: string;
}): Promise<void> {
  try {
    const stars = "★".repeat(opts.rating) + "☆".repeat(5 - opts.rating);
    const commentRow = opts.comment
      ? `<p style="margin:12px 0 0;padding:12px;background:#1d1a12;border-radius:8px;color:#ccc;font-size:14px;font-style:italic">"${opts.comment}"</p>`
      : "";
    const html = brandedHtml(
      "You Received a New Review",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.tradieName},</p>
       <p style="margin:0 0 8px;color:#ccc;font-size:15px"><strong style="color:#fff">${opts.reviewerName}</strong> left you a review for <strong style="color:#fff">"${opts.jobTitle}"</strong>.</p>
       <p style="margin:0 0 4px;font-size:22px;color:#ffc800;letter-spacing:2px">${stars}</p>
       <p style="margin:0 0 4px;color:#ffc800;font-weight:800;font-size:15px">${opts.rating} out of 5 stars</p>
       ${commentRow}
       <p style="margin:20px 0 0">
         <a href="${config.appUrl}/profile" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">View My Profile →</a>
       </p>`,
    );
    await sendViaHtml(opts.tradieEmail, opts.tradieName, `New ${opts.rating}-star review from ${opts.reviewerName}`, html);
    logger.info({ email: opts.tradieEmail }, "Review notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send review notification");
  }
}

export async function sendPartnerEnquiry(opts: {
  adminEmail: string;
  name: string;
  email: string;
  phone: string;
  tradeName: string;
  category: string;
  suburb: string;
  state: string;
  website?: string;
  message?: string;
}): Promise<void> {
  try {
    const rows = [
      ["Name", opts.name],
      ["Email", opts.email],
      ["Phone", opts.phone],
      ["Business / Trade Name", opts.tradeName],
      ["Category", opts.category],
      ["Location", `${opts.suburb}, ${opts.state}`],
      ...(opts.website ? [["Website", opts.website]] : []),
      ...(opts.message ? [["Message", opts.message]] : []),
    ]
      .map(([k, v]) => `<tr><td style="padding:8px 12px;color:#999;font-size:13px;width:40%;border-bottom:1px solid #1d1a12">${k}</td><td style="padding:8px 12px;color:#fff;font-size:14px;border-bottom:1px solid #1d1a12">${v}</td></tr>`)
      .join("");
    const html = brandedHtml(
      "New Partner Enquiry",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">A tradie submitted a partner enquiry via the website.</p>
       <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #1d1a12;border-radius:8px;overflow:hidden;margin-bottom:20px">${rows}</table>`,
    );
    await sendViaHtml(opts.adminEmail, "Fixit 24/7 Admin", "New Partner Enquiry", html);
    logger.info({ fromEmail: opts.email }, "Partner enquiry admin notification sent");
  } catch (err) {
    logger.error({ err }, "Failed to send partner enquiry admin email");
  }
}

export async function sendPartnerEnquiryConfirmation(opts: {
  email: string;
  name: string;
}): Promise<void> {
  try {
    const html = brandedHtml(
      "Thanks for Your Enquiry!",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.name},</p>
       <p style="margin:0 0 12px;color:#ccc;font-size:15px">Thanks for reaching out — we've received your partner enquiry and someone from our team will be in touch within 1–2 business days.</p>
       <p style="margin:0 0 20px;color:#ccc;font-size:15px">In the meantime, feel free to explore the platform and see how we're connecting homeowners with quality local tradies.</p>
       <p style="margin:0">
         <a href="${config.appUrl}" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Explore Fixit 24/7 →</a>
       </p>`,
    );
    await sendViaHtml(opts.email, opts.name, "We received your partner enquiry — Fixit 24/7", html);
    logger.info({ email: opts.email }, "Partner enquiry confirmation sent");
  } catch (err) {
    logger.error({ err }, "Failed to send partner enquiry confirmation");
  }
}

export async function sendTradieVerifiedEmail(opts: {
  email: string;
  name: string;
}): Promise<void> {
  try {
    const html = brandedHtml(
      "You're Verified! 🎉",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.name},</p>
       <p style="margin:0 0 12px;color:#ccc;font-size:15px">Great news — your Fixit 24/7 account has been <strong style="color:#fff">verified by our team</strong>. You're now fully approved and can claim jobs across the platform.</p>
       <p style="margin:0 0 20px;color:#ccc;font-size:15px">Your verified badge will appear on your profile, giving homeowners more confidence to choose you. Start browsing open jobs now.</p>
       <p style="margin:0">
         <a href="${config.appUrl}/jobs" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Browse Open Jobs →</a>
       </p>`,
    );
    await sendViaHtml(opts.email, opts.name, "You're verified on Fixit 24/7 — start claiming jobs!", html);
    logger.info({ email: opts.email }, "Tradie verified email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send tradie verified email");
  }
}

export async function sendTradieSuspendedEmail(opts: {
  email: string;
  name: string;
}): Promise<void> {
  try {
    const html = brandedHtml(
      "Account Status Update",
      `<p style="margin:0 0 16px;color:#ccc;font-size:15px">Hi ${opts.name},</p>
       <p style="margin:0 0 12px;color:#ccc;font-size:15px">Your Fixit 24/7 account has been <strong style="color:#fff">temporarily suspended</strong> by our moderation team.</p>
       <p style="margin:0 0 20px;color:#ccc;font-size:15px">If you believe this is an error, please contact us and we'll review your account as soon as possible.</p>
       <p style="margin:0">
         <a href="mailto:${config.sendgrid.fromEmail}" style="display:inline-block;padding:11px 22px;background:#ffc800;color:#000;font-weight:800;font-size:14px;border-radius:10px;text-decoration:none">Contact Support</a>
       </p>`,
    );
    await sendViaHtml(opts.email, opts.name, "Your Fixit 24/7 account status has changed", html);
    logger.info({ email: opts.email }, "Tradie suspended email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send tradie suspended email");
  }
}
