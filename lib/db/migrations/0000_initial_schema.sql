-- Fixit 24/7 — Initial schema migration
-- Dollar-based wallet model (Phase 1). Credits system removed.

--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM ('homeowner', 'tradie', 'admin');
--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM ('free', 'starter', 'pro');
--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM ('open', 'matched', 'in_progress', 'completed', 'cancelled');
--> statement-breakpoint
CREATE TYPE "public"."urgency" AS ENUM ('standard', 'urgent', 'emergency');
--> statement-breakpoint
CREATE TYPE "public"."size_band" AS ENUM ('small', 'medium', 'large', 'premium');
--> statement-breakpoint
CREATE TYPE "public"."claim_status" AS ENUM ('pending', 'accepted', 'rejected', 'withdrawn', 'completed');
--> statement-breakpoint
CREATE TYPE "public"."wallet_tx_type" AS ENUM ('welcome_grant', 'subscription_grant', 'lead_deduct', 'refund', 'adjustment');
--> statement-breakpoint

CREATE TABLE "categories" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL UNIQUE,
  "icon" text NOT NULL DEFAULT 'wrench',
  "description" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "role" "user_role" NOT NULL DEFAULT 'homeowner',
  "phone" text,
  "suburb" text,
  "postcode" text,
  "bio" text,
  "avatar_url" text,
  "rating" real,
  "review_count" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true,
  "is_verified" boolean NOT NULL DEFAULT false,
  "stripe_customer_id" text,
  -- Emergency membership (homeowner)
  "emergency_membership_active" boolean NOT NULL DEFAULT false,
  "emergency_membership_started_at" timestamp with time zone,
  "emergency_membership_renewal_date" timestamp with time zone,
  "emergency_calls_used_this_year" integer NOT NULL DEFAULT 0,
  "emergency_membership_plan" text,
  "emergency_waiting_period_ends_at" timestamp with time zone,
  "emergency_sub_id" text,
  "emergency_sub_cancel_at" boolean NOT NULL DEFAULT false,
  -- Trade specialisation
  "primary_trade" text,
  "secondary_trades" text[],
  -- Service area
  "service_radius" integer,
  "service_suburbs" text[],
  "latitude" real,
  "longitude" real,
  "work_photo_urls" text[],
  -- Tradie verification
  "abn" text,
  -- Tradie subscription tier
  "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'free',
  "subscription_started_at" timestamp with time zone,
  "subscription_stripe_sub_id" text,
  -- Welcome grant ($111/mo for 6 months)
  "welcome_grant_months_used" integer NOT NULL DEFAULT 0,
  "welcome_grant_started_at" timestamp with time zone,
  -- Free-tier monthly lead quota
  "free_leads_used_this_month" integer NOT NULL DEFAULT 0,
  "free_leads_month_reset_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "jobs" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "status" "job_status" NOT NULL DEFAULT 'open',
  "urgency" "urgency" NOT NULL DEFAULT 'standard',
  "category_id" integer NOT NULL REFERENCES "categories"("id"),
  "homeowner_id" integer NOT NULL REFERENCES "users"("id"),
  "suburb" text,
  "postcode" text,
  "address" text,
  "latitude" real,
  "longitude" real,
  "image_urls" text[] NOT NULL DEFAULT '{}',
  "budget" real,
  "size_band" "size_band",
  -- Lead cost in cents: $5=500, $10=1000, $20=2000, $35=3500
  "lead_cost_cents" integer,
  "scheduled_for" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "jobs_homeowner_id_idx" ON "jobs" ("homeowner_id");
--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" ("status");
--> statement-breakpoint
CREATE INDEX "jobs_category_id_idx" ON "jobs" ("category_id");
--> statement-breakpoint

CREATE TABLE "claims" (
  "id" serial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "jobs"("id"),
  "tradie_id" integer NOT NULL REFERENCES "users"("id"),
  "status" "claim_status" NOT NULL DEFAULT 'pending',
  "message" text,
  "proposed_price" real,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "claims_job_id_idx" ON "claims" ("job_id");
--> statement-breakpoint
CREATE INDEX "claims_tradie_id_idx" ON "claims" ("tradie_id");
--> statement-breakpoint
CREATE INDEX "claims_tradie_status_idx" ON "claims" ("tradie_id", "status");
--> statement-breakpoint

CREATE TABLE "tradie_skills" (
  "tradie_id" integer NOT NULL REFERENCES "users"("id"),
  "category_id" integer NOT NULL REFERENCES "categories"("id"),
  PRIMARY KEY ("tradie_id", "category_id")
);
--> statement-breakpoint

CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "job_id" integer REFERENCES "jobs"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "conversations" (
  "id" serial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
  "homeowner_id" integer NOT NULL REFERENCES "users"("id"),
  "tradie_id" integer NOT NULL REFERENCES "users"("id"),
  "last_message_at" timestamp with time zone,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "conversations_homeowner_id_idx" ON "conversations" ("homeowner_id");
--> statement-breakpoint
CREATE INDEX "conversations_tradie_id_idx" ON "conversations" ("tradie_id");
--> statement-breakpoint

CREATE TABLE "messages" (
  "id" serial PRIMARY KEY,
  "conversation_id" integer NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
  "sender_id" integer NOT NULL REFERENCES "users"("id"),
  "body" text NOT NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" ("conversation_id");
--> statement-breakpoint
CREATE INDEX "messages_conversation_sender_idx" ON "messages" ("conversation_id", "sender_id");
--> statement-breakpoint
CREATE INDEX "messages_conversation_read_idx" ON "messages" ("conversation_id", "is_read");
--> statement-breakpoint

CREATE TABLE "reviews" (
  "id" serial PRIMARY KEY,
  "job_id" integer NOT NULL REFERENCES "jobs"("id") ON DELETE CASCADE,
  "reviewer_id" integer NOT NULL REFERENCES "users"("id"),
  "reviewee_id" integer NOT NULL REFERENCES "users"("id"),
  "rating" integer NOT NULL,
  "comment" text,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

-- Dollar wallet — balance in cents
CREATE TABLE "wallet_balances" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") UNIQUE,
  "balance_cents" integer NOT NULL DEFAULT 0,
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE TABLE "wallet_transactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" "wallet_tx_type" NOT NULL,
  -- Positive = credit, negative = debit. In cents.
  "amount_cents" integer NOT NULL,
  "description" text,
  "stripe_session_id" text,
  "job_id" integer REFERENCES "jobs"("id"),
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions" ("user_id");
