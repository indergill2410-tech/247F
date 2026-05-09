-- 0001_wallet_and_subscription.sql
-- Additive migration: adds wallet system, subscription tiers, welcome grant columns.
-- Safe to run on existing databases — uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS.

--> statement-breakpoint
-- New enum types (wrapped in DO block so they skip if already present)
DO $$ BEGIN
  CREATE TYPE "public"."subscription_tier" AS ENUM ('free', 'starter', 'pro');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."wallet_tx_type" AS ENUM ('welcome_grant', 'subscription_grant', 'lead_deduct', 'refund', 'adjustment');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "public"."size_band" AS ENUM ('small', 'medium', 'large', 'premium');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Add subscription tier + welcome grant + free-lead-quota columns to users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS "subscription_started_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "subscription_stripe_sub_id" text,
  ADD COLUMN IF NOT EXISTS "welcome_grant_months_used" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "welcome_grant_started_at" timestamp with time zone,
  ADD COLUMN IF NOT EXISTS "free_leads_used_this_month" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "free_leads_month_reset_at" timestamp with time zone;
--> statement-breakpoint

-- Add lead_cost_cents to jobs (dollar-based, replaces old credit_cost if present)
ALTER TABLE "jobs"
  ADD COLUMN IF NOT EXISTS "lead_cost_cents" integer,
  ADD COLUMN IF NOT EXISTS "size_band" "size_band";
--> statement-breakpoint

-- Wallet balance table
CREATE TABLE IF NOT EXISTS "wallet_balances" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") UNIQUE,
  "balance_cents" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- Wallet transaction log
CREATE TABLE IF NOT EXISTS "wallet_transactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "wallet_tx_type" NOT NULL,
  "amount_cents" integer NOT NULL,
  "description" text,
  "stripe_session_id" text,
  "job_id" integer REFERENCES "jobs"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "wallet_transactions_user_id_idx" ON "wallet_transactions" ("user_id");
