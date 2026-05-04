import { db } from "@workspace/db";
import { usersTable, creditBalancesTable, creditTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export const CREDITS_PER_CLAIM = 222;
export const SIGNUP_GRANT = 1111;

export const CREDIT_PACKS = [
  { name: "Starter Pack", credits: 300, priceAud: 4900, stripeLookup: "credits_300" },
  { name: "Pro Pack", credits: 600, priceAud: 9900, stripeLookup: "credits_600" },
  { name: "Max Pack", credits: 1111, priceAud: 14900, stripeLookup: "credits_1111" },
] as const;

export async function getUserById(id: number) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  return user ?? null;
}

export async function getUserByStripeCustomerId(stripeCustomerId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, stripeCustomerId));
  return user ?? null;
}

export async function updateUserStripeCustomerId(userId: number, stripeCustomerId: string) {
  await db.update(usersTable).set({ stripeCustomerId }).where(eq(usersTable.id, userId));
}

export const EMERGENCY_MAX_CALLOUTS = 2;

export async function getEmergencyMembershipStatus(userId: number) {
  const [user] = await db
    .select({
      emergencyMemberActive: usersTable.emergencyMemberActive,
      emergencyMembershipStartedAt: usersTable.emergencyMembershipStartedAt,
      emergencyMembershipRenewalDate: usersTable.emergencyMembershipRenewalDate,
      emergencyCallsUsedThisYear: usersTable.emergencyCallsUsedThisYear,
      emergencyMembershipPlan: usersTable.emergencyMembershipPlan,
      emergencyWaitingPeriodEndsAt: usersTable.emergencyWaitingPeriodEndsAt,
      emergencySubId: usersTable.emergencySubId,
      emergencySubCancelAt: usersTable.emergencySubCancelAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId));
  return user ?? null;
}

export async function setEmergencyMembership(
  userId: number,
  data: {
    active: boolean;
    subId: string | null;
    renewalDate: Date | null;
    cancelAtPeriodEnd: boolean;
    startedAt?: Date | null;
    waitingPeriodEndsAt?: Date | null;
    callsUsed?: number;
    plan?: string | null;
  },
) {
  await db
    .update(usersTable)
    .set({
      emergencyMemberActive: data.active,
      emergencySubId: data.subId,
      emergencyMembershipRenewalDate: data.renewalDate,
      emergencySubCancelAt: data.cancelAtPeriodEnd,
      ...(data.startedAt !== undefined && { emergencyMembershipStartedAt: data.startedAt }),
      ...(data.waitingPeriodEndsAt !== undefined && { emergencyWaitingPeriodEndsAt: data.waitingPeriodEndsAt }),
      ...(data.callsUsed !== undefined && { emergencyCallsUsedThisYear: data.callsUsed }),
      ...(data.plan !== undefined && { emergencyMembershipPlan: data.plan }),
      updatedAt: sql`NOW()`,
    })
    .where(eq(usersTable.id, userId));
}

export async function incrementEmergencyCallsUsed(userId: number): Promise<void> {
  await db
    .update(usersTable)
    .set({
      emergencyCallsUsedThisYear: sql`${usersTable.emergencyCallsUsedThisYear} + 1`,
      updatedAt: sql`NOW()`,
    })
    .where(eq(usersTable.id, userId));
}

export async function getCreditBalance(userId: number): Promise<number> {
  const [row] = await db.select().from(creditBalancesTable).where(eq(creditBalancesTable.userId, userId));
  return row?.balance ?? 0;
}

export async function ensureCreditBalance(userId: number): Promise<void> {
  await db
    .insert(creditBalancesTable)
    .values({ userId, balance: 0 })
    .onConflictDoNothing();
}

export async function grantCredits(
  userId: number,
  amount: number,
  type: "signup_grant" | "monthly_renewal" | "purchase" | "refund",
  description: string,
  stripeSessionId?: string,
): Promise<void> {
  await ensureCreditBalance(userId);
  await db
    .update(creditBalancesTable)
    .set({ balance: sql`${creditBalancesTable.balance} + ${amount}`, updatedAt: sql`NOW()` })
    .where(eq(creditBalancesTable.userId, userId));

  await db.insert(creditTransactionsTable).values({
    userId,
    type,
    amount,
    description,
    stripeSessionId: stripeSessionId ?? null,
  });
}

export async function deductCredits(
  userId: number,
  amount: number,
  description: string,
): Promise<{ success: boolean; balance: number }> {
  await ensureCreditBalance(userId);
  const current = await getCreditBalance(userId);
  if (current < amount) {
    return { success: false, balance: current };
  }

  await db
    .update(creditBalancesTable)
    .set({ balance: sql`${creditBalancesTable.balance} - ${amount}`, updatedAt: sql`NOW()` })
    .where(eq(creditBalancesTable.userId, userId));

  await db.insert(creditTransactionsTable).values({
    userId,
    type: "claim_deduct",
    amount: -amount,
    description,
  });

  return { success: true, balance: current - amount };
}

export async function getCreditTransactions(userId: number, limit = 20) {
  return db
    .select()
    .from(creditTransactionsTable)
    .where(eq(creditTransactionsTable.userId, userId))
    .orderBy(sql`${creditTransactionsTable.createdAt} DESC`)
    .limit(limit);
}

export async function getSubscription(subscriptionId: string) {
  const result = await db.execute(sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`);
  return result.rows[0] ?? null;
}

export async function runMonthlyRenewal(): Promise<{ renewed: number; skipped: number }> {
  const tradies = await db
    .select({ id: usersTable.id, name: usersTable.name })
    .from(usersTable)
    .where(eq(usersTable.role, "tradie"));

  let renewed = 0;
  let skipped = 0;

  for (const tradie of tradies) {
    try {
      await ensureCreditBalance(tradie.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const recentRenewal = await db
        .select({ id: creditTransactionsTable.id })
        .from(creditTransactionsTable)
        .where(
          sql`${creditTransactionsTable.userId} = ${tradie.id}
            AND ${creditTransactionsTable.type} = 'monthly_renewal'
            AND ${creditTransactionsTable.createdAt} >= ${startOfMonth.toISOString()}`,
        )
        .limit(1);

      if (recentRenewal.length > 0) {
        skipped++;
        continue;
      }

      await db
        .update(creditBalancesTable)
        .set({ balance: SIGNUP_GRANT, updatedAt: sql`NOW()` })
        .where(eq(creditBalancesTable.userId, tradie.id));

      const month = new Date().toLocaleString("en-AU", { month: "long", year: "numeric" });
      await db.insert(creditTransactionsTable).values({
        userId: tradie.id,
        type: "monthly_renewal",
        amount: SIGNUP_GRANT,
        description: `Monthly credit renewal — ${SIGNUP_GRANT.toLocaleString()} credits for ${month}`,
        stripeSessionId: null,
      });

      renewed++;
    } catch {
      skipped++;
    }
  }

  return { renewed, skipped };
}

export async function getProductsWithPrices() {
  const result = await db.execute(sql`
    SELECT
      p.id as product_id,
      p.name as product_name,
      p.description as product_description,
      p.active as product_active,
      p.metadata as product_metadata,
      pr.id as price_id,
      pr.unit_amount,
      pr.currency,
      pr.recurring,
      pr.active as price_active,
      pr.metadata as price_metadata
    FROM stripe.products p
    LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
    WHERE p.active = true
    ORDER BY pr.unit_amount ASC
  `);
  return result.rows;
}
