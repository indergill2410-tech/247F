import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Determines lead cost tier for pricing matrix (see openai.ts BAND_RANGE)
// premium: plumbing, electrical, HVAC, roofing — licensed, high urgency, constrained supply
// high:    locksmith, glazing, carpentry — skilled, often urgent
// standard: painting, tiling, pest control, plastering — competitive supply
// low:     landscaping, cleaning — commodity, high supply
export const leadTierEnum = pgEnum("lead_tier", ["premium", "high", "standard", "low"]);

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  icon: text("icon").notNull().default("wrench"),
  description: text("description"),
  // Lead pricing tier — determines cost matrix in openai.ts
  leadTier: leadTierEnum("lead_tier").notNull().default("standard"),
  // Whether tradies in this category must hold a state/territory licence before claiming jobs.
  // Plumbing, Electrical, HVAC, Roofing, Pest Control require licences in all Australian states.
  // Painting, Carpentry, Tiling, Cleaning, Landscaping, Glazing, Locksmith do NOT require licences nationally.
  requiresLicence: boolean("requires_licence").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categoriesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categoriesTable.$inferSelect;
