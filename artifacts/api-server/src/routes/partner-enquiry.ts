import { Router } from "express";
import { logger } from "../lib/logger.js";
import { sendPartnerEnquiry, sendPartnerEnquiryConfirmation } from "../lib/email.js";
import { config } from "../config/index.js";

const router = Router();

// POST /api/partner-enquiry — public, no auth required
router.post("/partner-enquiry", async (req, res): Promise<void> => {
  const { name, email, phone, tradeName, category, suburb, state, website, message, consent } = req.body ?? {};

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400).json({ error: "validation_error", message: "Name is required" });
    return;
  }
  if (!email || typeof email !== "string" || !/\S+@\S+\.\S+/.test(email)) {
    res.status(400).json({ error: "validation_error", message: "Valid email is required" });
    return;
  }
  if (!phone || typeof phone !== "string" || phone.replace(/\D/g, "").length < 8) {
    res.status(400).json({ error: "validation_error", message: "Valid phone number is required" });
    return;
  }
  if (!tradeName || typeof tradeName !== "string" || tradeName.trim().length < 2) {
    res.status(400).json({ error: "validation_error", message: "Business or trade name is required" });
    return;
  }
  if (!category || typeof category !== "string") {
    res.status(400).json({ error: "validation_error", message: "Category is required" });
    return;
  }
  if (!suburb || typeof suburb !== "string" || suburb.trim().length < 2) {
    res.status(400).json({ error: "validation_error", message: "Suburb is required" });
    return;
  }
  if (!state || typeof state !== "string") {
    res.status(400).json({ error: "validation_error", message: "State is required" });
    return;
  }
  if (consent !== true) {
    res.status(400).json({ error: "validation_error", message: "Consent is required" });
    return;
  }

  const adminEmail = config.adminEmails[0] ?? config.sendgrid.fromEmail;

  await Promise.all([
    sendPartnerEnquiry({
      adminEmail,
      name: String(name).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      tradeName: String(tradeName).trim(),
      category: String(category).trim(),
      suburb: String(suburb).trim(),
      state: String(state).trim(),
      website: website ? String(website).trim() : undefined,
      message: message ? String(message).trim() : undefined,
    }).catch((err) => logger.error({ err }, "Failed to send partner enquiry admin email")),

    sendPartnerEnquiryConfirmation({
      email: String(email).trim(),
      name: String(name).trim(),
    }).catch((err) => logger.error({ err }, "Failed to send partner enquiry confirmation")),
  ]);

  logger.info({ email, tradeName }, "Partner enquiry received");
  res.status(201).json({ success: true, message: "Enquiry received — we'll be in touch soon!" });
});

export default router;
