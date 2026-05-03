/**
 * Seed realistic demo data for Fixit 24/7
 * Run: pnpm --filter @workspace/scripts run seed-demo
 *
 * Safe to re-run — skips already-seeded users by email.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import { eq, sql } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ── Inline minimal schema ──────────────────────────────────────────────────
// (avoids cross-package import issues in scripts)
import { pgTable, text, integer, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

const roleEnum = pgEnum("role", ["homeowner", "tradie", "admin"]);
const jobStatusEnum = pgEnum("job_status", ["open", "in_progress", "completed", "cancelled"]);
const urgencyEnum = pgEnum("urgency", ["standard", "urgent", "emergency"]);
const claimStatusEnum = pgEnum("claim_status", ["pending", "accepted", "rejected", "withdrawn", "completed"]);
const creditTxTypeEnum = pgEnum("credit_tx_type", ["signup_grant", "monthly_renewal", "purchase", "refund", "claim_deduct"]);

const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull(),
  bio: text("bio"),
  suburb: text("suburb"),
  postcode: text("postcode"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  rating: real("rating"),
  reviewCount: integer("review_count").default(0),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const jobs = pgTable("jobs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: jobStatusEnum("status").notNull().default("open"),
  urgency: urgencyEnum("urgency").notNull().default("standard"),
  categoryId: integer("category_id").notNull(),
  homeownerId: integer("homeowner_id").notNull(),
  suburb: text("suburb"),
  postcode: text("postcode"),
  address: text("address"),
  imageUrls: text("image_urls").array().notNull().default([]),
  budget: real("budget"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const claims = pgTable("claims", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull(),
  tradieId: integer("tradie_id").notNull(),
  status: claimStatusEnum("status").notNull().default("pending"),
  message: text("message"),
  proposedPrice: real("proposed_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull(),
  homeownerId: integer("homeowner_id").notNull(),
  tradieId: integer("tradie_id").notNull(),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const reviews = pgTable("reviews", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  jobId: integer("job_id").notNull(),
  reviewerId: integer("reviewer_id").notNull(),
  revieweeId: integer("reviewee_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const creditBalances = pgTable("credit_balances", {
  userId: integer("user_id").primaryKey(),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const creditTransactions = pgTable("credit_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("user_id").notNull(),
  type: creditTxTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  stripeSessionId: text("stripe_session_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const tradieSkills = pgTable("tradie_skills", {
  tradieId: integer("tradie_id").notNull(),
  categoryId: integer("category_id").notNull(),
});

// ── Helpers ────────────────────────────────────────────────────────────────
async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser(data: {
  name: string; email: string; password: string; role: "homeowner" | "tradie" | "admin";
  bio?: string; suburb?: string; postcode?: string; phone?: string; rating?: number; reviewCount?: number;
}): Promise<number> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email));
  if (existing.length > 0) {
    console.log(`  → Skipped (exists): ${data.email}`);
    return existing[0]!.id;
  }
  const passwordHash = await hashPassword(data.password);
  const [u] = await db.insert(users).values({
    name: data.name, email: data.email, passwordHash, role: data.role,
    bio: data.bio, suburb: data.suburb, postcode: data.postcode, phone: data.phone,
    rating: data.rating, reviewCount: data.reviewCount ?? 0,
  }).returning({ id: users.id });
  console.log(`  ✓ Created ${data.role}: ${data.name} (${data.email})`);
  return u!.id;
}

async function grantStarterCredits(userId: number) {
  const GRANT = 1111;
  await db.insert(creditBalances).values({ userId, balance: GRANT }).onConflictDoNothing();
  const existing = await db.select({ id: creditTransactions.id })
    .from(creditTransactions)
    .where(sql`${creditTransactions.userId} = ${userId} AND ${creditTransactions.type} = 'signup_grant'`);
  if (existing.length === 0) {
    await db.insert(creditTransactions).values({
      userId, type: "signup_grant", amount: GRANT,
      description: "Welcome bonus — 1,111 free credits to get started",
    });
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function seed() {
  console.log("\n🌱 Seeding Fixit 24/7 demo data...\n");

  // Category IDs (already seeded)
  const CAT = {
    plumbing: 1, electrical: 2, carpentry: 3, painting: 4,
    roofing: 5, landscaping: 6, hvac: 7, tiling: 8,
    plastering: 9, cleaning: 10, pest: 11, locksmith: 12,
  };

  // ── Users ──────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  // Homeowners
  const h1 = await upsertUser({ name: "Sarah Johnson", email: "homeowner@fixit247.com", password: "password123", role: "homeowner", suburb: "Bondi", postcode: "2026", phone: "0412 345 678" });
  const h2 = await upsertUser({ name: "James Wilson", email: "james.wilson@example.com", password: "password123", role: "homeowner", suburb: "Surry Hills", postcode: "2010", phone: "0423 456 789" });
  const h3 = await upsertUser({ name: "Priya Sharma", email: "priya.sharma@example.com", password: "password123", role: "homeowner", suburb: "Parramatta", postcode: "2150", phone: "0434 567 890" });
  const h4 = await upsertUser({ name: "Tom Fletcher", email: "tom.fletcher@example.com", password: "password123", role: "homeowner", suburb: "Manly", postcode: "2095", phone: "0445 678 901" });

  // Tradies
  const t1 = await upsertUser({ name: "Mike Roberts", email: "tradie@fixit247.com", password: "password123", role: "tradie", bio: "Master plumber with 15 years experience. Licensed & insured. Available 24/7 for emergencies.", suburb: "Newtown", postcode: "2042", phone: "0456 789 012", rating: 4.8, reviewCount: 23 });
  const t2 = await upsertUser({ name: "Dave Chen", email: "dave.chen@example.com", password: "password123", role: "tradie", bio: "Licensed electrician specialising in residential and commercial work. Safety-first approach.", suburb: "Chatswood", postcode: "2067", phone: "0467 890 123", rating: 4.9, reviewCount: 41 });
  const t3 = await upsertUser({ name: "Luke Patterson", email: "luke.patterson@example.com", password: "password123", role: "tradie", bio: "Expert carpenter and joiner. Custom furniture, decks, renovations. 20 years in the trade.", suburb: "Leichhardt", postcode: "2040", phone: "0478 901 234", rating: 4.7, reviewCount: 18 });
  const t4 = await upsertUser({ name: "Sam Nguyen", email: "sam.nguyen@example.com", password: "password123", role: "tradie", bio: "Professional painter. Residential and commercial. Interior & exterior. Clean and precise work.", suburb: "Burwood", postcode: "2134", phone: "0489 012 345", rating: 4.6, reviewCount: 29 });
  const t5 = await upsertUser({ name: "Raj Patel", email: "raj.patel@example.com", password: "password123", role: "tradie", bio: "HVAC specialist. Installation, servicing and repairs for all major brands. Fully licensed.", suburb: "Ryde", postcode: "2112", phone: "0490 123 456", rating: 4.8, reviewCount: 35 });

  // Grant credits to all tradies
  console.log("\n💳 Granting starter credits to tradies...");
  for (const tid of [t1, t2, t3, t4, t5]) {
    await grantStarterCredits(tid);
  }

  // Assign tradie skills
  console.log("\n🔧 Assigning tradie skills...");
  const skillAssignments = [
    { tradieId: t1, categoryIds: [CAT.plumbing] },
    { tradieId: t2, categoryIds: [CAT.electrical] },
    { tradieId: t3, categoryIds: [CAT.carpentry] },
    { tradieId: t4, categoryIds: [CAT.painting, CAT.plastering] },
    { tradieId: t5, categoryIds: [CAT.hvac] },
  ];
  for (const { tradieId, categoryIds } of skillAssignments) {
    for (const categoryId of categoryIds) {
      await db.insert(tradieSkills).values({ tradieId, categoryId }).onConflictDoNothing();
    }
  }

  // ── Jobs ───────────────────────────────────────────────────────────────
  console.log("\n🏠 Creating jobs...");

  type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
  type Urgency = "standard" | "urgent" | "emergency";

  const jobsData: {
    title: string; description: string; status: JobStatus; urgency: Urgency;
    categoryId: number; homeownerId: number; suburb: string; postcode: string;
    budget?: number;
  }[] = [
    // OPEN jobs
    { title: "Leaking kitchen tap urgent fix", description: "My kitchen tap has been dripping constantly for 3 days. Need a licensed plumber to replace the washer or tap mechanism. It's getting worse — water is now pooling under the sink.", status: "open", urgency: "urgent", categoryId: CAT.plumbing, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 250 },
    { title: "Install 4 power points in home office", description: "Setting up a home office and need 4 additional double power points installed. Two on the east wall, two on the west wall. Good access to the ceiling cavity.", status: "open", urgency: "standard", categoryId: CAT.electrical, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 600 },
    { title: "Custom built-in bookshelf — lounge room", description: "Want a floor-to-ceiling built-in bookshelf for the lounge room. Approx 3m wide × 2.7m high. White painted finish to match existing joinery. Have rough drawings to share.", status: "open", urgency: "standard", categoryId: CAT.carpentry, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 2800 },
    { title: "Bathroom tiles need re-grouting", description: "Shower tiles need all grout removed and replaced. About 8sqm. Some tiles are loose and may need re-setting. Prefer a light grey grout.", status: "open", urgency: "standard", categoryId: CAT.tiling, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 500 },
    { title: "No power in 3 rooms — urgent!", description: "Power has gone out in the master bedroom, bathroom and hallway. Breaker keeps tripping. Tried resetting — won't stay on. Need an electrician ASAP.", status: "open", urgency: "emergency", categoryId: CAT.electrical, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 400 },
    { title: "Garden maintenance — lawns, hedges, cleanup", description: "Need a full garden tidy up. Lawn is overgrown (front and back), hedges need trimming, general weeding and cleanup. Approx 400sqm total.", status: "open", urgency: "standard", categoryId: CAT.landscaping, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 350 },
    { title: "Interior repaint — 3 bedroom apartment", description: "Moving into a new rental and want to repaint before furniture arrives. 3 bedrooms, open plan living/dining/kitchen, 1 bathroom. Walls only, ceilings already white. Want light neutral tones.", status: "open", urgency: "standard", categoryId: CAT.painting, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 3500 },
    { title: "Ducted AC service — not cooling properly", description: "Ducted split system (Daikin 10kw) installed 4 years ago. Not cooling as well as it should. Needs a full service — clean filters, check gas, test all zones.", status: "open", urgency: "urgent", categoryId: CAT.hvac, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 300 },

    // IN PROGRESS jobs
    { title: "Hot water system replacement", description: "Old Rheem storage hot water system (25yr old) has failed. Need replaced with a new unit — happy with same style or can discuss heat pump options. Good access.", status: "in_progress", urgency: "urgent", categoryId: CAT.plumbing, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 1800 },
    { title: "Outdoor deck build — 4m × 5m", description: "Want to build a treated pine deck off the back of the house. 4m wide × 5m deep. Slightly elevated (300mm). Includes 3 steps down to lawn. Need council-compliant balustrades.", status: "in_progress", urgency: "standard", categoryId: CAT.carpentry, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 12000 },
    { title: "Ceiling crack repair and repaint", description: "Large plaster crack running across the lounge room ceiling — about 1.8m long. Needs filling, sanding, sealing and repaint to match. Single coat should do it.", status: "in_progress", urgency: "standard", categoryId: CAT.plastering, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 450 },

    // COMPLETED jobs
    { title: "Blocked drain — bathroom", description: "Bathroom drain completely blocked. Water not draining at all from sink and shower. Need cleared urgently.", status: "completed", urgency: "emergency", categoryId: CAT.plumbing, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 300 },
    { title: "Install security lights — front of house", description: "Want 2 motion-activated LED security lights installed at the front of the house. Mounting points already roughed in. Just need wiring and fitting.", status: "completed", urgency: "standard", categoryId: CAT.electrical, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 350 },
    { title: "Pest inspection and treatment", description: "Moving into property, want full pest inspection before we settle furniture. Then treatment for any issues found — particularly concerned about termites.", status: "completed", urgency: "standard", categoryId: CAT.pest, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 400 },
    { title: "Fence repair after storm damage", description: "Colorbond fence section blown over in last week's storm. About 6m of fencing needs resetting posts and panels replaced. Some panels are still usable.", status: "completed", urgency: "urgent", categoryId: CAT.carpentry, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 900 },
  ];

  const jobIds: number[] = [];
  for (const j of jobsData) {
    const [row] = await db.insert(jobs).values(j).returning({ id: jobs.id });
    jobIds.push(row!.id);
    console.log(`  ✓ Job: "${j.title}" (${j.status})`);
  }

  // Map by title for easy reference
  const jobMap: Record<string, number> = {};
  jobsData.forEach((j, i) => { jobMap[j.title] = jobIds[i]!; });

  // ── Claims ─────────────────────────────────────────────────────────────
  console.log("\n📋 Creating claims...");

  // Open jobs — pending claims
  await db.insert(claims).values({ jobId: jobMap["Leaking kitchen tap urgent fix"]!, tradieId: t1, status: "pending", message: "Hi Sarah! I can fix this today. Sounds like the tap seat needs replacing or the whole mixer. I carry all common parts in my van. Happy to come out this afternoon.", proposedPrice: 220 });
  await db.insert(claims).values({ jobId: jobMap["Leaking kitchen tap urgent fix"]!, tradieId: t2, status: "pending", message: "Can help with this. Just need to check if it's a jumper valve or ceramic disc tap first — will bring both. Available tomorrow morning from 8am.", proposedPrice: 195 });

  await db.insert(claims).values({ jobId: jobMap["Install 4 power points in home office"]!, tradieId: t2, status: "pending", message: "Easy job. I can run the circuits from the existing GPO in the hallway. Should take 3-4 hours. License and insurance on request.", proposedPrice: 580 });

  await db.insert(claims).values({ jobId: jobMap["Custom built-in bookshelf — lounge room"]!, tradieId: t3, status: "pending", message: "Love this kind of project! I've done dozens of built-in bookshelves. Would need to come out for a measure-up first. Can do that this week at no cost.", proposedPrice: 2650 });

  await db.insert(claims).values({ jobId: jobMap["No power in 3 rooms — urgent!"]!, tradieId: t2, status: "pending", message: "This sounds like a faulty breaker or possibly a wiring fault. I can be there within the hour. Emergency call-out applies but I'll diagnose and fix today.", proposedPrice: 380 });

  // In-progress jobs — accepted claims
  const [claimHWS] = await db.insert(claims).values({ jobId: jobMap["Hot water system replacement"]!, tradieId: t1, status: "accepted", message: "I can replace this today. I stock the Rheem 125L which is the most reliable replacement. Also happy to discuss a heat pump — saves ~70% on running costs.", proposedPrice: 1750 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "in_progress" }).where(eq(jobs.id, jobMap["Hot water system replacement"]!));

  const [claimDeck] = await db.insert(claims).values({ jobId: jobMap["Outdoor deck build — 4m × 5m"]!, tradieId: t3, status: "accepted", message: "Great project — I've built many decks like this. I'll use H3 treated pine for the frame and H4 for the posts. All materials council-compliant. Can start next Monday.", proposedPrice: 11500 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "in_progress" }).where(eq(jobs.id, jobMap["Outdoor deck build — 4m × 5m"]!));

  const [claimCeiling] = await db.insert(claims).values({ jobId: jobMap["Ceiling crack repair and repaint"]!, tradieId: t4, status: "accepted", message: "Plaster ceiling cracks are my specialty. I'll cut the crack out, bond it, fibreglass tape, skim coat, prime and paint. Should match perfectly.", proposedPrice: 420 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "in_progress" }).where(eq(jobs.id, jobMap["Ceiling crack repair and repaint"]!));

  // Completed jobs — accepted → completed claims
  const [claimDrain] = await db.insert(claims).values({ jobId: jobMap["Blocked drain — bathroom"]!, tradieId: t1, status: "completed", message: "On my way! I'll bring my drain snake and high-pressure jetter just in case.", proposedPrice: 280 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "completed" }).where(eq(jobs.id, jobMap["Blocked drain — bathroom"]!));

  const [claimLights] = await db.insert(claims).values({ jobId: jobMap["Install security lights — front of house"]!, tradieId: t2, status: "completed", message: "Happy to help. I'll use quality Clipsal lights — 10 year warranty. Can do Saturday morning.", proposedPrice: 330 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "completed" }).where(eq(jobs.id, jobMap["Install security lights — front of house"]!));

  const [claimPest] = await db.insert(claims).values({ jobId: jobMap["Pest inspection and treatment"]!, tradieId: t5, status: "completed", message: "I can do the full inspection and termite barrier treatment in one visit. AEPMA certified. Full written report provided.", proposedPrice: 380 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "completed" }).where(eq(jobs.id, jobMap["Pest inspection and treatment"]!));

  const [claimFence] = await db.insert(claims).values({ jobId: jobMap["Fence repair after storm damage"]!, tradieId: t3, status: "completed", message: "I deal with storm damage regularly. I'll re-set the posts in concrete and reuse the good panels. Should be done in a day.", proposedPrice: 850 }).returning({ id: claims.id });
  await db.update(jobs).set({ status: "completed" }).where(eq(jobs.id, jobMap["Fence repair after storm damage"]!));

  console.log("  ✓ Claims created");

  // ── Conversations & Messages ────────────────────────────────────────────
  console.log("\n💬 Creating conversations and messages...");

  type ConvRow = { id: number };

  async function createConv(jobId: number, homeownerId: number, tradieId: number, msgs: { senderId: number; body: string }[]): Promise<void> {
    const [conv] = await db.insert(conversations).values({ jobId, homeownerId, tradieId, lastMessageAt: new Date() }).returning({ id: conversations.id }) as ConvRow[];
    for (const m of msgs) {
      await db.insert(messages).values({ conversationId: conv!.id, senderId: m.senderId, body: m.body, isRead: true });
    }
  }

  // HWS (in-progress)
  await createConv(jobMap["Hot water system replacement"]!, h2, t1, [
    { senderId: h2, body: "Hi Mike! Great — when can you come?" },
    { senderId: t1, body: "Tomorrow morning 8am work for you? I'll grab the Rheem 125L from the supplier on the way." },
    { senderId: h2, body: "Perfect, 8am is great. I'll make sure I'm home." },
    { senderId: t1, body: "See you then. I'll send a text when I'm 20 mins away." },
  ]);

  // Deck (in-progress)
  await createConv(jobMap["Outdoor deck build — 4m × 5m"]!, h3, t3, [
    { senderId: h3, body: "Thanks Luke! Monday works perfectly. What time?" },
    { senderId: t3, body: "7:30am start if that's OK? Beats the heat. I'll have my apprentice with me." },
    { senderId: h3, body: "That's fine. I'll leave the side gate open for you." },
    { senderId: t3, body: "Perfect. I'll bring the frame materials Monday and do the decking boards later in the week." },
    { senderId: h3, body: "Sounds like a plan. Looking forward to seeing it come together!" },
  ]);

  // Completed jobs
  await createConv(jobMap["Blocked drain — bathroom"]!, h1, t1, [
    { senderId: h1, body: "Mike you're a lifesaver! How soon can you be here?" },
    { senderId: t1, body: "20 mins. It's likely hair/soap buildup — common in Bondi with hard water. Easy fix." },
    { senderId: h1, body: "Thank god. The whole family is waiting 😅" },
    { senderId: t1, body: "On my way now!" },
    { senderId: h1, body: "All sorted! Thank you so much, amazing service." },
    { senderId: t1, body: "No worries at all. Let me know if anything else comes up!" },
  ]);

  await createConv(jobMap["Install security lights — front of house"]!, h3, t2, [
    { senderId: h3, body: "Dave, Saturday morning works great. What time?" },
    { senderId: t2, body: "9am. Should take about 2 hours. I'll bring the Clipsal Pro Series lights." },
    { senderId: h3, body: "Perfect, see you then!" },
    { senderId: t2, body: "All done and tested. Both lights working perfectly. I've set the sensitivity and timer as well." },
    { senderId: h3, body: "They look great! So much better than our old lights. Thanks Dave." },
  ]);

  await createConv(jobMap["Fence repair after storm damage"]!, h4, t3, [
    { senderId: h4, body: "Luke, can you start this week? The neighbour is worried about security." },
    { senderId: t3, body: "Yes, I can do Thursday. I'll concrete the posts in and let them cure overnight, then fix the panels Friday." },
    { senderId: h4, body: "That works well, thanks!" },
    { senderId: t3, body: "All done! Looks as good as new. The posts are solid — concreted 600mm deep." },
    { senderId: h4, body: "Fantastic work Luke! Really happy with how it turned out." },
  ]);

  console.log("  ✓ Conversations and messages created");

  // ── Reviews ────────────────────────────────────────────────────────────
  console.log("\n⭐ Creating reviews...");

  // Blocked drain — h1 reviews t1
  await db.insert(reviews).values({ jobId: jobMap["Blocked drain — bathroom"]!, reviewerId: h1, revieweeId: t1, rating: 5, comment: "Mike was incredible — arrived within 20 minutes, cleared the drain in no time, explained everything he was doing, and even checked under the sink for any other issues. Couldn't recommend him more highly!" });

  // Security lights — h3 reviews t2
  await db.insert(reviews).values({ jobId: jobMap["Install security lights — front of house"]!, reviewerId: h3, revieweeId: t2, rating: 5, comment: "Dave was punctual, professional and did a clean job. No mess left behind and everything works perfectly. He also set the sensitivity so the lights aren't triggered by passing cars. Very happy!" });

  // Pest — h2 reviews t5
  await db.insert(reviews).values({ jobId: jobMap["Pest inspection and treatment"]!, reviewerId: h2, revieweeId: t5, rating: 4, comment: "Raj was thorough and professional. Found some minor evidence of termite activity and treated it immediately. Full written report was very detailed. Would have given 5 stars but was slightly late." });

  // Fence — h4 reviews t3
  await db.insert(reviews).values({ jobId: jobMap["Fence repair after storm damage"]!, reviewerId: h4, revieweeId: t3, rating: 5, comment: "Luke did an outstanding job on the fence. You can't even tell there was storm damage — it looks brand new. Very reasonable price and great communication throughout." });

  // Update tradie ratings
  await db.execute(sql`
    UPDATE users SET
      rating = sub.avg_rating,
      review_count = sub.cnt
    FROM (
      SELECT reviewee_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as cnt
      FROM reviews GROUP BY reviewee_id
    ) sub
    WHERE users.id = sub.reviewee_id
  `);

  console.log("  ✓ Reviews created and tradie ratings updated");

  // ── Deduct credits for claims made ─────────────────────────────────────
  console.log("\n💳 Deducting credits for claims...");
  const CREDITS_PER_CLAIM = 222;
  // Mike made: leaking tap claim, HWS (accepted), drain (completed), + t1 already has signup grant
  for (const _ of [1, 2, 3, 4]) {
    await db.execute(sql`UPDATE credit_balances SET balance = balance - ${CREDITS_PER_CLAIM} WHERE user_id = ${t1} AND balance >= ${CREDITS_PER_CLAIM}`);
    await db.insert(creditTransactions).values({ userId: t1, type: "claim_deduct", amount: -CREDITS_PER_CLAIM, description: "Credits deducted for job claim" });
  }
  // Dave made: leaking tap claim, power points, no-power, security lights, — 4 claims
  for (const _ of [1, 2, 3, 4]) {
    await db.execute(sql`UPDATE credit_balances SET balance = balance - ${CREDITS_PER_CLAIM} WHERE user_id = ${t2} AND balance >= ${CREDITS_PER_CLAIM}`);
    await db.insert(creditTransactions).values({ userId: t2, type: "claim_deduct", amount: -CREDITS_PER_CLAIM, description: "Credits deducted for job claim" });
  }
  // Luke: bookshelf, deck, fence — 3 claims
  for (const _ of [1, 2, 3]) {
    await db.execute(sql`UPDATE credit_balances SET balance = balance - ${CREDITS_PER_CLAIM} WHERE user_id = ${t3} AND balance >= ${CREDITS_PER_CLAIM}`);
    await db.insert(creditTransactions).values({ userId: t3, type: "claim_deduct", amount: -CREDITS_PER_CLAIM, description: "Credits deducted for job claim" });
  }
  console.log("  ✓ Credits deducted for demo claims");

  console.log("\n✅ Demo seed complete!\n");
  console.log("Demo accounts:");
  console.log("  Homeowners: homeowner@fixit247.com, james.wilson@example.com, priya.sharma@example.com, tom.fletcher@example.com");
  console.log("  Tradies:    tradie@fixit247.com, dave.chen@example.com, luke.patterson@example.com, sam.nguyen@example.com, raj.patel@example.com");
  console.log("  Admin:      admin@fixit247.com");
  console.log("  Password:   password123 (all accounts)\n");

  await pool.end();
  process.exit(0);
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });
