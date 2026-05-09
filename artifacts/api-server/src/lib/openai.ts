import OpenAI from "openai";
import { logger } from "./logger.js";

export type SizeBand = "small" | "medium" | "large" | "premium";

// Lead cost ranges in cents (e.g. 3000 = $30.00)
export const BAND_RANGE: Record<SizeBand, { min: number; max: number; midpoint: number }> = {
  small:   { min: 3000,  max: 6000,  midpoint: 4500 },
  medium:  { min: 8000,  max: 15000, midpoint: 11500 },
  large:   { min: 20000, max: 40000, midpoint: 30000 },
  premium: { min: 50000, max: 80000, midpoint: 65000 },
};

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
 * Estimate per-job lead cost in cents within the homeowner's chosen size band.
 * Falls back to the band midpoint if the AI call fails.
 */
export async function estimateLeadCostCents(params: {
  title: string;
  description: string;
  categoryName?: string | null;
  sizeBand: SizeBand;
  budget?: number | null;
  urgency?: string;
}): Promise<number> {
  const range = BAND_RANGE[params.sizeBand];
  const minDollars = range.min / 100;
  const maxDollars = range.max / 100;

  const client = getClient();
  if (!client) {
    logger.warn({ sizeBand: params.sizeBand }, "AI client unavailable — using band midpoint");
    return range.midpoint;
  }

  try {
    const prompt = `You are a pricing assistant for a home repair marketplace. Based on the job details below, estimate a lead cost (in Australian dollars) for a tradie to claim this job.

The homeowner classified it as "${params.sizeBand}" — the allowed range is A$${minDollars}–A$${maxDollars}.

Job details:
Title: ${params.title}
Description: ${params.description}
Category: ${params.categoryName ?? "General"}
Urgency: ${params.urgency ?? "standard"}
${params.budget ? `Homeowner budget: A$${params.budget}` : ""}

Consider the complexity, skill required, and time estimate to pick a fair cost within the range.
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
      return clamp(cents, range.min, range.max);
    }
  } catch (err) {
    logger.error({ err, sizeBand: params.sizeBand }, "AI lead cost estimation failed — using band midpoint");
  }

  return range.midpoint;
}
