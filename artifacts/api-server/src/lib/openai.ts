import OpenAI from "openai";
import { logger } from "./logger.js";

export type SizeBand = "small" | "medium" | "large" | "premium";

export const BAND_RANGE: Record<SizeBand, { min: number; max: number; midpoint: number }> = {
  small:   { min: 30,  max: 60,  midpoint: 45 },
  medium:  { min: 80,  max: 150, midpoint: 115 },
  large:   { min: 200, max: 400, midpoint: 300 },
  premium: { min: 500, max: 800, midpoint: 650 },
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
 * Estimate a per-job credit cost within the homeowner's chosen size band.
 * Falls back to the band midpoint if the AI call fails.
 */
export async function estimateCreditCost(params: {
  title: string;
  description: string;
  categoryName?: string | null;
  sizeBand: SizeBand;
  budget?: number | null;
  urgency?: string;
}): Promise<number> {
  const range = BAND_RANGE[params.sizeBand];

  const client = getClient();
  if (!client) {
    logger.warn({ sizeBand: params.sizeBand }, "AI client unavailable — using band midpoint");
    return range.midpoint;
  }

  try {
    const prompt = `You are a pricing assistant for a home repair marketplace. Based on the job details below, estimate a credit cost for a tradie to claim this job.

The homeowner classified it as "${params.sizeBand}" — the allowed credit range is ${range.min}–${range.max}.

Job details:
Title: ${params.title}
Description: ${params.description}
Category: ${params.categoryName ?? "General"}
Urgency: ${params.urgency ?? "standard"}
${params.budget ? `Homeowner budget: A$${params.budget}` : ""}

Consider the complexity, skill required, and time estimate to pick a fair cost within the range.
Reply with ONLY a JSON object: {"estimated_credit_cost": <integer between ${range.min} and ${range.max}>}`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const match = content.match(/"estimated_credit_cost"\s*:\s*(\d+)/);
    if (match) {
      const raw = parseInt(match[1], 10);
      return clamp(raw, range.min, range.max);
    }
  } catch (err) {
    logger.error({ err, sizeBand: params.sizeBand }, "AI credit estimation failed — using band midpoint");
  }

  return range.midpoint;
}
