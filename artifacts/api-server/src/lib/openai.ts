import OpenAI from "openai";

if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY must be set");
}

export const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

export type SizeBand = "small" | "medium" | "large" | "premium";

export const CREDIT_COST_BY_BAND: Record<SizeBand, number> = {
  small:   50,
  medium:  100,
  large:   200,
  premium: 400,
};

/**
 * Classify a job into a size band using AI.
 * Falls back to "medium" if AI call fails.
 */
export async function classifyJobSize(params: {
  title: string;
  description: string;
  categoryName?: string | null;
  budget?: number | null;
  urgency?: string;
}): Promise<{ sizeBand: SizeBand; creditCost: number }> {
  try {
    const prompt = `You are a home repair job sizing assistant. Classify the following job into exactly one size band.

Size bands:
- small: Minor repairs, simple tasks, under 2 hours of work. Examples: tap washer replacement, lock change, patch a small hole, replace a powerpoint.
- medium: Standard jobs, 2–8 hours, moderate complexity. Examples: install a ceiling fan, fix a leaking pipe, paint a room, replace a toilet.
- large: Complex jobs, multiple days or trades, significant work. Examples: bathroom renovation, re-roof a garage, rewire several circuits, install ducted AC.
- premium: Major projects, extensive scope, high skill or multiple trades. Examples: full kitchen renovation, full house rewire, major structural repair, new hot water system + plumbing re-pipe.

Job to classify:
Title: ${params.title}
Description: ${params.description}
Category: ${params.categoryName ?? "General"}
Urgency: ${params.urgency ?? "standard"}
Budget (AUD): ${params.budget ? `$${params.budget}` : "Not specified"}

Reply with ONLY a JSON object: {"sizeBand": "<small|medium|large|premium>"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5-nano",
      max_completion_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "";
    const match = content.match(/"sizeBand"\s*:\s*"(small|medium|large|premium)"/);
    if (match) {
      const sizeBand = match[1] as SizeBand;
      return { sizeBand, creditCost: CREDIT_COST_BY_BAND[sizeBand] };
    }
  } catch {
    // Fall through to default
  }

  return { sizeBand: "medium", creditCost: CREDIT_COST_BY_BAND.medium };
}
