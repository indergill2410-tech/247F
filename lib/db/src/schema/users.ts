import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  real,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["homeowner", "tradie", "admin"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("homeowner"),
  phone: text("phone"),
  suburb: text("suburb"),
  postcode: text("postcode"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  rating: real("rating"),
  reviewCount: integer("review_count").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  // Emergency 24/7 membership — business fields (required by spec)
  emergencyMemberActive: boolean("emergency_member_active").notNull().default(false),
  emergencyMembershipStartedAt: timestamp("emergency_membership_started_at", { withTimezone: true }),
  emergencyMembershipRenewalDate: timestamp("emergency_membership_renewal_date", { withTimezone: true }),
  emergencyCallsUsedThisYear: integer("emergency_calls_used_this_year").notNull().default(0),
  emergencyMembershipPlan: text("emergency_membership_plan"),
  emergencyWaitingPeriodEndsAt: timestamp("emergency_waiting_period_ends_at", { withTimezone: true }),
  // Internal Stripe reference (for API calls — cancel, verify)
  emergencySubId: text("emergency_sub_id"),
  emergencySubCancelAt: boolean("emergency_sub_cancel_at").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
