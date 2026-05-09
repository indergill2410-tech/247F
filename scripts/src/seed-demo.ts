/**
 * Seed realistic demo data for Fixit 24/7
 * Run: pnpm --filter @workspace/scripts run seed-demo
 *
 * Safe to re-run — skips already-seeded users by email.
 * Uses raw SQL for inserts to stay schema-version-independent.
 */
import pkg from "pg";
const { Pool } = pkg;
import * as bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Helpers ────────────────────────────────────────────────────────────────

async function query<T extends Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}

async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function upsertUser(data: {
  name: string; email: string; password: string; role: "homeowner" | "tradie" | "admin";
  bio?: string; suburb?: string; postcode?: string; phone?: string;
  rating?: number; reviewCount?: number; isVerified?: boolean;
  primaryTrade?: string;
}): Promise<number> {
  const existing = await query<{ id: number }>(
    "SELECT id FROM users WHERE email = $1", [data.email]
  );
  if (existing.length > 0) {
    console.log(`  → Skipped (exists): ${data.email}`);
    return existing[0]!.id;
  }
  const passwordHash = await hashPassword(data.password);
  const rows = await query<{ id: number }>(
    `INSERT INTO users (name, email, password_hash, role, bio, suburb, postcode, phone,
       rating, review_count, is_verified, primary_trade)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      data.name, data.email, passwordHash, data.role,
      data.bio ?? null, data.suburb ?? null, data.postcode ?? null, data.phone ?? null,
      data.rating ?? null, data.reviewCount ?? 0,
      data.isVerified ?? false, data.primaryTrade ?? null,
    ]
  );
  console.log(`  ✓ Created ${data.role}: ${data.name} (${data.email})`);
  return rows[0]!.id;
}

async function grantWelcomeWallet(userId: number): Promise<void> {
  const GRANT_CENTS = 11100; // $111.00
  // Upsert wallet balance
  await query(
    `INSERT INTO wallet_balances (user_id, balance_cents)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, GRANT_CENTS]
  );
  // Record transaction if not already there
  const exists = await query(
    `SELECT id FROM wallet_transactions WHERE user_id = $1 AND type = 'welcome_grant'`,
    [userId]
  );
  if (exists.length === 0) {
    await query(
      `INSERT INTO wallet_transactions (user_id, type, amount_cents, description)
       VALUES ($1, 'welcome_grant', $2, '$111 welcome credit — free for 6 months')`,
      [userId, GRANT_CENTS]
    );
    // Mark welcome grant started
    await query(
      `UPDATE users SET welcome_grant_months_used = 1, welcome_grant_started_at = NOW() WHERE id = $1`,
      [userId]
    );
  }
}

async function deductWallet(userId: number, amountCents: number, description: string, jobId: number): Promise<void> {
  await query(
    `UPDATE wallet_balances SET balance_cents = balance_cents - $1, updated_at = NOW() WHERE user_id = $2`,
    [amountCents, userId]
  );
  await query(
    `INSERT INTO wallet_transactions (user_id, type, amount_cents, description, job_id)
     VALUES ($1, 'lead_deduct', $2, $3, $4)`,
    [userId, -amountCents, description, jobId]
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log("\n🌱 Seeding Fixit 24/7 demo data...\n");

  // Category IDs (must match seed-products)
  const CAT = {
    plumbing: 1, electrical: 2, carpentry: 3, painting: 4,
    roofing: 5, landscaping: 6, hvac: 7, tiling: 8,
    plastering: 9, cleaning: 10, pest: 11, locksmith: 12,
  };

  // ── Users ──────────────────────────────────────────────────────────────
  console.log("👤 Creating users...");

  // Admin
  const admin = await upsertUser({
    name: "Fixit 24/7 Admin", email: "admin@fixit247.com", password: "admin123",
    role: "admin", suburb: "Sydney", postcode: "2000",
  });

  // Homeowners
  const h1 = await upsertUser({ name: "Sarah Johnson", email: "homeowner@fixit247.com", password: "password123", role: "homeowner", suburb: "Bondi", postcode: "2026", phone: "0412 345 678" });
  const h2 = await upsertUser({ name: "James Wilson", email: "james.wilson@example.com", password: "password123", role: "homeowner", suburb: "Surry Hills", postcode: "2010", phone: "0423 456 789" });
  const h3 = await upsertUser({ name: "Priya Sharma", email: "priya.sharma@example.com", password: "password123", role: "homeowner", suburb: "Parramatta", postcode: "2150", phone: "0434 567 890" });
  const h4 = await upsertUser({ name: "Tom Fletcher", email: "tom.fletcher@example.com", password: "password123", role: "homeowner", suburb: "Manly", postcode: "2095", phone: "0445 678 901" });

  // Tradies
  const t1 = await upsertUser({ name: "Mike Roberts", email: "tradie@fixit247.com", password: "password123", role: "tradie", isVerified: true, primaryTrade: "Plumbing", bio: "Master plumber with 15 years experience. Licensed & insured. Available 24/7 for emergencies.", suburb: "Newtown", postcode: "2042", phone: "0456 789 012", rating: 4.8, reviewCount: 23 });
  const t2 = await upsertUser({ name: "Dave Chen", email: "dave.chen@example.com", password: "password123", role: "tradie", isVerified: true, primaryTrade: "Electrical", bio: "Licensed electrician specialising in residential and commercial work. Safety-first approach.", suburb: "Chatswood", postcode: "2067", phone: "0467 890 123", rating: 4.9, reviewCount: 41 });
  const t3 = await upsertUser({ name: "Luke Patterson", email: "luke.patterson@example.com", password: "password123", role: "tradie", isVerified: true, primaryTrade: "Carpentry", bio: "Expert carpenter and joiner. Custom furniture, decks, renovations. 20 years in the trade.", suburb: "Leichhardt", postcode: "2040", phone: "0478 901 234", rating: 4.7, reviewCount: 18 });
  const t4 = await upsertUser({ name: "Sam Nguyen", email: "sam.nguyen@example.com", password: "password123", role: "tradie", isVerified: true, primaryTrade: "Painting", bio: "Professional painter. Residential and commercial. Interior & exterior. Clean and precise work.", suburb: "Burwood", postcode: "2134", phone: "0489 012 345", rating: 4.6, reviewCount: 29 });
  const t5 = await upsertUser({ name: "Raj Patel", email: "raj.patel@example.com", password: "password123", role: "tradie", isVerified: true, primaryTrade: "HVAC / Air Conditioning", bio: "HVAC specialist. Installation, servicing and repairs for all major brands. Fully licensed.", suburb: "Ryde", postcode: "2112", phone: "0490 123 456", rating: 4.8, reviewCount: 35 });

  // ── Wallet grants ──────────────────────────────────────────────────────
  console.log("\n💰 Granting $111 welcome wallet to tradies...");
  for (const tid of [t1, t2, t3, t4, t5]) {
    await grantWelcomeWallet(tid);
  }

  // ── Tradie skills ──────────────────────────────────────────────────────
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
      await query(
        `INSERT INTO tradie_skills (tradie_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [tradieId, categoryId]
      );
    }
  }

  // ── Jobs ───────────────────────────────────────────────────────────────
  console.log("\n🏠 Creating jobs...");

  type JobData = {
    title: string; description: string; status: string; urgency: string;
    categoryId: number; homeownerId: number; suburb: string; postcode: string;
    budget?: number; leadCostCents: number;
  };

  const jobsData: JobData[] = [
    // OPEN jobs
    { title: "Leaking kitchen tap urgent fix", description: "My kitchen tap has been dripping constantly for 3 days. Need a licensed plumber to replace the washer or tap mechanism. It's getting worse — water is now pooling under the sink.", status: "open", urgency: "urgent", categoryId: CAT.plumbing, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 250, leadCostCents: 2200 },
    { title: "Install 4 power points in home office", description: "Setting up a home office and need 4 additional double power points installed. Two on the east wall, two on the west wall. Good access to the ceiling cavity.", status: "open", urgency: "standard", categoryId: CAT.electrical, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 600, leadCostCents: 3500 },
    { title: "Custom built-in bookshelf — lounge room", description: "Want a floor-to-ceiling built-in bookshelf for the lounge room. Approx 3m wide × 2.7m high. White painted finish to match existing joinery. Have rough drawings to share.", status: "open", urgency: "standard", categoryId: CAT.carpentry, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 2800, leadCostCents: 5500 },
    { title: "Bathroom tiles need re-grouting", description: "Shower tiles need all grout removed and replaced. About 8sqm. Some tiles are loose and may need re-setting. Prefer a light grey grout.", status: "open", urgency: "standard", categoryId: CAT.tiling, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 500, leadCostCents: 2800 },
    { title: "No power in 3 rooms — urgent!", description: "Power has gone out in the master bedroom, bathroom and hallway. Breaker keeps tripping. Tried resetting — won't stay on. Need an electrician ASAP.", status: "open", urgency: "emergency", categoryId: CAT.electrical, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 400, leadCostCents: 3000 },
    { title: "Garden maintenance — lawns, hedges, cleanup", description: "Need a full garden tidy up. Lawn is overgrown (front and back), hedges need trimming, general weeding and cleanup. Approx 400sqm total.", status: "open", urgency: "standard", categoryId: CAT.landscaping, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 350, leadCostCents: 2200 },
    { title: "Interior repaint — 3 bedroom apartment", description: "Moving into a new rental and want to repaint before furniture arrives. 3 bedrooms, open plan living/dining/kitchen, 1 bathroom. Walls only, ceilings already white. Want light neutral tones.", status: "open", urgency: "standard", categoryId: CAT.painting, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 3500, leadCostCents: 6500 },
    { title: "Ducted AC service — not cooling properly", description: "Ducted split system (Daikin 10kw) installed 4 years ago. Not cooling as well as it should. Needs a full service — clean filters, check gas, test all zones.", status: "open", urgency: "urgent", categoryId: CAT.hvac, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 300, leadCostCents: 2500 },

    // IN PROGRESS
    { title: "Hot water system replacement", description: "Old Rheem storage hot water system (25yr old) has failed. Need replaced with a new unit — happy with same style or can discuss heat pump options. Good access.", status: "in_progress", urgency: "urgent", categoryId: CAT.plumbing, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 1800, leadCostCents: 4500 },
    { title: "Outdoor deck build — 4m × 5m", description: "Want to build a treated pine deck off the back of the house. 4m wide × 5m deep. Slightly elevated (300mm). Includes 3 steps down to lawn. Need council-compliant balustrades.", status: "in_progress", urgency: "standard", categoryId: CAT.carpentry, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 12000, leadCostCents: 8000 },
    { title: "Ceiling crack repair and repaint", description: "Large plaster crack running across the lounge room ceiling — about 1.8m long. Needs filling, sanding, sealing and repaint to match. Single coat should do it.", status: "in_progress", urgency: "standard", categoryId: CAT.plastering, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 450, leadCostCents: 2500 },

    // COMPLETED
    { title: "Blocked drain — bathroom", description: "Bathroom drain completely blocked. Water not draining at all from sink and shower. Need cleared urgently.", status: "completed", urgency: "emergency", categoryId: CAT.plumbing, homeownerId: h1, suburb: "Bondi", postcode: "2026", budget: 300, leadCostCents: 2200 },
    { title: "Install security lights — front of house", description: "Want 2 motion-activated LED security lights installed at the front of the house. Mounting points already roughed in. Just need wiring and fitting.", status: "completed", urgency: "standard", categoryId: CAT.electrical, homeownerId: h3, suburb: "Parramatta", postcode: "2150", budget: 350, leadCostCents: 2200 },
    { title: "Pest inspection and treatment", description: "Moving into property, want full pest inspection before we settle furniture. Then treatment for any issues found — particularly concerned about termites.", status: "completed", urgency: "standard", categoryId: CAT.pest, homeownerId: h2, suburb: "Surry Hills", postcode: "2010", budget: 400, leadCostCents: 2800 },
    { title: "Fence repair after storm damage", description: "Colorbond fence section blown over in last week's storm. About 6m of fencing needs resetting posts and panels replaced. Some panels are still usable.", status: "completed", urgency: "urgent", categoryId: CAT.carpentry, homeownerId: h4, suburb: "Manly", postcode: "2095", budget: 900, leadCostCents: 3500 },
  ];

  const jobMap: Record<string, number> = {};
  for (const j of jobsData) {
    const rows = await query<{ id: number }>(
      `INSERT INTO jobs (title, description, status, urgency, category_id, homeowner_id, suburb, postcode, budget, lead_cost_cents)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [j.title, j.description, j.status, j.urgency, j.categoryId, j.homeownerId, j.suburb, j.postcode, j.budget ?? null, j.leadCostCents]
    );
    jobMap[j.title] = rows[0]!.id;
    console.log(`  ✓ Job: "${j.title}" (${j.status})`);
  }

  // ── Claims ─────────────────────────────────────────────────────────────
  console.log("\n📋 Creating claims...");

  async function insertClaim(data: { jobId: number; tradieId: number; status: string; message: string; proposedPrice?: number }): Promise<number> {
    const rows = await query<{ id: number }>(
      `INSERT INTO claims (job_id, tradie_id, status, message, proposed_price) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [data.jobId, data.tradieId, data.status, data.message, data.proposedPrice ?? null]
    );
    return rows[0]!.id;
  }

  // Open — pending
  await insertClaim({ jobId: jobMap["Leaking kitchen tap urgent fix"]!, tradieId: t1, status: "pending", message: "Hi Sarah! I can fix this today. Sounds like the tap seat needs replacing. I carry all common parts in my van.", proposedPrice: 220 });
  await insertClaim({ jobId: jobMap["Leaking kitchen tap urgent fix"]!, tradieId: t2, status: "pending", message: "Can help with this. Available tomorrow morning from 8am.", proposedPrice: 195 });
  await insertClaim({ jobId: jobMap["Install 4 power points in home office"]!, tradieId: t2, status: "pending", message: "Easy job. I can run the circuits from the existing GPO in the hallway. Should take 3–4 hours.", proposedPrice: 580 });
  await insertClaim({ jobId: jobMap["Custom built-in bookshelf — lounge room"]!, tradieId: t3, status: "pending", message: "Love this kind of project! Would need to come out for a measure-up first — happy to do that at no cost.", proposedPrice: 2650 });
  await insertClaim({ jobId: jobMap["No power in 3 rooms — urgent!"]!, tradieId: t2, status: "pending", message: "Sounds like a faulty breaker. I can be there within the hour. Emergency call-out applies.", proposedPrice: 380 });

  // In-progress — accepted
  const claimHWSId = await insertClaim({ jobId: jobMap["Hot water system replacement"]!, tradieId: t1, status: "accepted", message: "I can replace this today. I stock the Rheem 125L which is the most reliable replacement.", proposedPrice: 1750 });
  await query(`UPDATE jobs SET status = 'in_progress' WHERE id = $1`, [jobMap["Hot water system replacement"]]);

  const claimDeckId = await insertClaim({ jobId: jobMap["Outdoor deck build — 4m × 5m"]!, tradieId: t3, status: "accepted", message: "Great project — I've built many decks like this. All materials council-compliant. Can start next Monday.", proposedPrice: 11500 });
  await query(`UPDATE jobs SET status = 'in_progress' WHERE id = $1`, [jobMap["Outdoor deck build — 4m × 5m"]]);

  await insertClaim({ jobId: jobMap["Ceiling crack repair and repaint"]!, tradieId: t4, status: "accepted", message: "Plaster ceiling cracks are my specialty. Fibreglass tape, skim coat, prime and paint. Will match perfectly.", proposedPrice: 420 });
  await query(`UPDATE jobs SET status = 'in_progress' WHERE id = $1`, [jobMap["Ceiling crack repair and repaint"]]);

  // Completed — accepted → completed
  await insertClaim({ jobId: jobMap["Blocked drain — bathroom"]!, tradieId: t1, status: "completed", message: "On my way! I'll bring my drain snake and high-pressure jetter just in case.", proposedPrice: 280 });
  await query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobMap["Blocked drain — bathroom"]]);

  await insertClaim({ jobId: jobMap["Install security lights — front of house"]!, tradieId: t2, status: "completed", message: "Happy to help. I'll use quality Clipsal lights — 10 year warranty. Can do Saturday morning.", proposedPrice: 330 });
  await query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobMap["Install security lights — front of house"]]);

  await insertClaim({ jobId: jobMap["Pest inspection and treatment"]!, tradieId: t5, status: "completed", message: "Full inspection and termite barrier treatment in one visit. AEPMA certified. Full written report provided.", proposedPrice: 380 });
  await query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobMap["Pest inspection and treatment"]]);

  await insertClaim({ jobId: jobMap["Fence repair after storm damage"]!, tradieId: t3, status: "completed", message: "I deal with storm damage regularly. I'll re-set the posts in concrete and reuse the good panels.", proposedPrice: 850 });
  await query(`UPDATE jobs SET status = 'completed' WHERE id = $1`, [jobMap["Fence repair after storm damage"]]);

  console.log("  ✓ Claims created");

  // ── Deduct wallet for claims made ──────────────────────────────────────
  console.log("\n💳 Deducting wallet for demo claims...");
  // Mike (t1): 4 claims
  for (const title of ["Leaking kitchen tap urgent fix", "Hot water system replacement", "Blocked drain — bathroom"]) {
    const cost = jobsData.find(j => j.title === title)?.leadCostCents ?? 2200;
    await deductWallet(t1, cost, `Lead claim: ${title}`, jobMap[title]!);
  }
  // Dave (t2): 4 claims
  for (const title of ["Leaking kitchen tap urgent fix", "Install 4 power points in home office", "No power in 3 rooms — urgent!", "Install security lights — front of house"]) {
    const cost = jobsData.find(j => j.title === title)?.leadCostCents ?? 2200;
    await deductWallet(t2, cost, `Lead claim: ${title}`, jobMap[title]!);
  }
  // Luke (t3): 3 claims
  for (const title of ["Custom built-in bookshelf — lounge room", "Outdoor deck build — 4m × 5m", "Fence repair after storm damage"]) {
    const cost = jobsData.find(j => j.title === title)?.leadCostCents ?? 2200;
    await deductWallet(t3, cost, `Lead claim: ${title}`, jobMap[title]!);
  }
  // Raj (t5): 1 claim
  await deductWallet(t5, jobsData.find(j => j.title === "Pest inspection and treatment")!.leadCostCents, "Lead claim: Pest inspection and treatment", jobMap["Pest inspection and treatment"]!);

  // ── Conversations & Messages ────────────────────────────────────────────
  console.log("\n💬 Creating conversations and messages...");

  async function createConv(jobId: number, homeownerId: number, tradieId: number, msgs: { senderId: number; body: string }[]): Promise<void> {
    const rows = await query<{ id: number }>(
      `INSERT INTO conversations (job_id, homeowner_id, tradie_id, last_message_at) VALUES ($1,$2,$3,NOW()) RETURNING id`,
      [jobId, homeownerId, tradieId]
    );
    const convId = rows[0]!.id;
    for (const m of msgs) {
      await query(
        `INSERT INTO messages (conversation_id, sender_id, body, is_read) VALUES ($1,$2,$3,true)`,
        [convId, m.senderId, m.body]
      );
    }
  }

  await createConv(jobMap["Hot water system replacement"]!, h2, t1, [
    { senderId: h2, body: "Hi Mike! Great — when can you come?" },
    { senderId: t1, body: "Tomorrow morning 8am work for you? I'll grab the Rheem 125L from the supplier on the way." },
    { senderId: h2, body: "Perfect, 8am is great. I'll make sure I'm home." },
    { senderId: t1, body: "See you then. I'll send a text when I'm 20 mins away." },
  ]);

  await createConv(jobMap["Outdoor deck build — 4m × 5m"]!, h3, t3, [
    { senderId: h3, body: "Thanks Luke! Monday works perfectly. What time?" },
    { senderId: t3, body: "7:30am start if that's OK? Beats the heat. I'll have my apprentice with me." },
    { senderId: h3, body: "That's fine. I'll leave the side gate open for you." },
    { senderId: t3, body: "Perfect. I'll bring the frame materials Monday and do the decking boards later in the week." },
    { senderId: h3, body: "Sounds like a plan. Looking forward to seeing it come together!" },
  ]);

  await createConv(jobMap["Blocked drain — bathroom"]!, h1, t1, [
    { senderId: h1, body: "Mike you're a lifesaver! How soon can you be here?" },
    { senderId: t1, body: "20 mins. It's likely hair/soap buildup — common in Bondi. Easy fix." },
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
    { senderId: t3, body: "Yes, I can do Thursday. I'll concrete the posts in overnight, then fix panels Friday." },
    { senderId: h4, body: "That works well, thanks!" },
    { senderId: t3, body: "All done! Looks as good as new. Posts concreted 600mm deep." },
    { senderId: h4, body: "Fantastic work Luke! Really happy with how it turned out." },
  ]);

  console.log("  ✓ Conversations and messages created");

  // ── Reviews ────────────────────────────────────────────────────────────
  console.log("\n⭐ Creating reviews...");

  await query(
    `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)`,
    [jobMap["Blocked drain — bathroom"], h1, t1, 5, "Mike was incredible — arrived within 20 minutes, cleared the drain in no time. Couldn't recommend him more highly!"]
  );
  await query(
    `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)`,
    [jobMap["Install security lights — front of house"], h3, t2, 5, "Dave was punctual, professional and did a clean job. Everything works perfectly. Very happy!"]
  );
  await query(
    `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)`,
    [jobMap["Pest inspection and treatment"], h2, t5, 4, "Raj was thorough and professional. Found termite activity and treated immediately. Full written report. Would have given 5 stars but was slightly late."]
  );
  await query(
    `INSERT INTO reviews (job_id, reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4,$5)`,
    [jobMap["Fence repair after storm damage"], h4, t3, 5, "Luke did an outstanding job on the fence. You can't even tell there was storm damage. Very reasonable price and great communication."]
  );

  // Update tradie ratings from reviews
  await query(`
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

  console.log(`
✅ Demo seed complete!

Demo credentials:
  Homeowner:  homeowner@fixit247.com   / password123
  Tradie:     tradie@fixit247.com      / password123
  Admin:      admin@fixit247.com       / admin123

Additional test accounts (all password123):
  Homeowners: james.wilson@example.com, priya.sharma@example.com, tom.fletcher@example.com
  Tradies:    dave.chen@example.com, luke.patterson@example.com, sam.nguyen@example.com, raj.patel@example.com
`);

  await pool.end();
  process.exit(0);
}

seed().catch((e) => { console.error("Seed failed:", e); process.exit(1); });
