import OpenAI from "openai";
import { logger } from "./logger.js";

export type SizeBand = "small" | "medium" | "large" | "premium";
export type LeadTier = "premium" | "high" | "standard" | "low";

// Lead cost ranges in cents — per trade tier × job size band.
//
// Tier definitions (set on the categories table):
//   premium  — Plumbing, Electrical, HVAC, Roofing: licensed, high urgency, constrained supply
//   high     — Locksmith, Glazing, Carpentry: skilled, often urgent
//   standard — Painting, Tiling, Pest Control, Plastering: competitive supply
//   low      — Cleaning, Landscaping: commodity, high supply
//
// Pricing rationale (verified against hipages, Oneflare, Bark.com AU rates 2025):
//   Lead cost ≈ 8–12% of average job value for that band/tier.
//   At Fixit 24/7's 5-tradie semi-exclusive model, conversion rate ≈ 30%, so
//   effective customer acquisition cost = lead cost / 0.30 ≈ 3× the lead price.
//   Licensed trades command a premium because homeowner urgency is higher and
//   supply of qualified tradies is constrained.
export const BAND_RANGE: Record<LeadTier, Record<SizeBand, { min: number; max: number; midpoint: number }>> = {
  premium: {
    small:   { min: 1800, max: 2800, midpoint: 2300 },  // e.g. tap fix $150–350 → lead $18–28
    medium:  { min: 3000, max: 5000, midpoint: 4000 },  // e.g. HWS repair $350–900 → lead $30–50
    large:   { min: 5500, max: 9000, midpoint: 7300 },  // e.g. HWS replace $900–2500 → lead $55–90
    premium: { min: 10000, max: 18000, midpoint: 14000 }, // e.g. full rewire $2500–10k → lead $100–180
  },
  high: {
    small:   { min: 1500, max: 2500, midpoint: 2000 },
    medium:  { min: 2500, max: 4200, midpoint: 3400 },
    large:   { min: 4500, max: 7500, midpoint: 6000 },
    premium: { min: 8000, max: 14000, midpoint: 11000 },
  },
  standard: {
    small:   { min: 1200, max: 2000, midpoint: 1600 },
    medium:  { min: 2000, max: 3500, midpoint: 2800 },
    large:   { min: 3500, max: 6500, midpoint: 5000 },
    premium: { min: 7000, max: 12000, midpoint: 9500 },
  },
  low: {
    small:   { min: 800,  max: 1500, midpoint: 1200 },
    medium:  { min: 1400, max: 2500, midpoint: 2000 },
    large:   { min: 2500, max: 4500, midpoint: 3500 },
    premium: { min: 5000, max: 9000, midpoint: 7000 },
  },
};

// Convenience export for routes that need a fallback midpoint without knowing the tier
export function getBandMidpoint(tier: LeadTier, band: SizeBand): number {
  return BAND_RANGE[tier][band].midpoint;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getClient(): OpenAI | null {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey  = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ baseURL, apiKey });
}

/**
 * Estimate per-job lead cost in cents within the homeowner's chosen size band,
 * taking into account the trade tier (premium/high/standard/low) and urgency.
 * Falls back to the band midpoint if the AI call fails or no AI client is configured.
 */
export async function estimateLeadCostCents(params: {
  title: string;
  description: string;
  categoryName?: string | null;
  leadTier?: LeadTier;
  sizeBand: SizeBand;
  budget?: number | null;
  urgency?: string;
}): Promise<number> {
  const tier = params.leadTier ?? "standard";
  const range = BAND_RANGE[tier][params.sizeBand];
  const minDollars = range.min / 100;
  const maxDollars = range.max / 100;

  const client = getClient();
  if (!client) {
    logger.warn({ sizeBand: params.sizeBand, leadTier: tier }, "AI client unavailable — using band midpoint");
    return applyUrgencyMultiplier(range.midpoint, params.urgency, range);
  }

  try {
    const prompt = `You are a pricing assistant for an Australian home repair marketplace. Based on the job details below, estimate a fair lead cost (in Australian dollars) for a tradie to claim this job.

The homeowner classified it as "${params.sizeBand}" — the allowed range for this trade is A$${minDollars}–A$${maxDollars}.

Job details:
Title: ${params.title}
Description: ${params.description}
Category: ${params.categoryName ?? "General"}
Urgency: ${params.urgency ?? "standard"}
${params.budget ? `Homeowner budget: A$${params.budget}` : ""}

Consider the complexity, skill level required, and typical time to pick a fair lead cost within the allowed range.
Reply with ONLY a JSON object: {"estimated_lead_cost_dollars": <integer between ${minDollars} and ${maxDollars}>}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const match = content.match(/"estimated_lead_cost_dollars"\s*:\s*(\d+)/);
    if (match) {
      const dollars = parseInt(match[1], 10);
      const cents = dollars * 100;
      const clamped = clamp(cents, range.min, range.max);
      return applyUrgencyMultiplier(clamped, params.urgency, range);
    }
  } catch (err) {
    logger.error({ err, sizeBand: params.sizeBand, leadTier: tier }, "AI lead cost estimation failed — using band midpoint");
  }

  return applyUrgencyMultiplier(range.midpoint, params.urgency, range);
}

// Emergency jobs get a 1.3× multiplier — homeowner is distressed, conversion rate is ~60%,
// and tradies responding quickly to emergencies earn more. Capped at range.max × 1.4.
function applyUrgencyMultiplier(
  baseCents: number,
  urgency: string | undefined,
  range: { min: number; max: number },
): number {
  if (urgency === "emergency") {
    return Math.round(clamp(baseCents * 1.3, range.min * 1.2, range.max * 1.4));
  }
  if (urgency === "urgent") {
    return Math.round(clamp(baseCents * 1.1, range.min, range.max * 1.1));
  }
  return baseCents;
}
