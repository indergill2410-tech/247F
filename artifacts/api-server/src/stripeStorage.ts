import { db } from "@workspace/db";
import { usersTable, walletBalancesTable, walletTransactionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

export const LEAD_COST_CENTS_DEFAULT = 2200; // $22.00 default per lead
export const WELCOME_GRANT_CENTS = 11100; // A$111.00 monthly welcome job lead credit grant

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
      emergencyMembershipActive: usersTable.emergencyMembershipActive,
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
      emergencyMembershipActive: data.active,
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

export async function getWalletBalance(userId: number): Promise<number> {
  const [row] = await db.select().from(walletBalancesTable).where(eq(walletBalancesTable.userId, userId));
  return row?.balanceCents ?? 0;
}

export async function ensureWalletBalance(userId: number): Promise<void> {
  await db
    .insert(walletBalancesTable)
    .values({ userId, balanceCents: 0 })
    .onConflictDoNothing();
}

export async function grantWalletFunds(
  userId: number,
  amountCents: number,
  type: "welcome_grant" | "subscription_grant" | "refund" | "adjustment",
  description: string,
  stripeSessionId?: string,
): Promise<void> {
  await ensureWalletBalance(userId);
  await db
    .update(walletBalancesTable)
    .set({ balanceCents: sql`${walletBalancesTable.balanceCents} + ${amountCents}`, updatedAt: sql`NOW()` })
    .where(eq(walletBalancesTable.userId, userId));

  await db.insert(walletTransactionsTable).values({
    userId,
    type,
    amountCents,
    description,
    stripeSessionId: stripeSessionId ?? null,
  });
}

export async function deductWalletFunds(
  userId: number,
  amountCents: number,
  description: string,
  jobId?: number,
): Promise<{ success: boolean; balanceCents: number }> {
  await ensureWalletBalance(userId);
  const current = await getWalletBalance(userId);
  if (current < amountCents) {
    return { success: false, balanceCents: current };
  }

  await db
    .update(walletBalancesTable)
    .set({ balanceCents: sql`${walletBalancesTable.balanceCents} - ${amountCents}`, updatedAt: sql`NOW()` })
    .where(eq(walletBalancesTable.userId, userId));

  await db.insert(walletTransactionsTable).values({
    userId,
    type: "lead_deduct",
    amountCents: -amountCents,
    description,
    jobId: jobId ?? null,
  });

  return { success: true, balanceCents: current - amountCents };
}

export async function getWalletTransactions(userId: number, limit = 20) {
  return db
    .select()
    .from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, userId))
    .orderBy(sql`${walletTransactionsTable.createdAt} DESC`)
    .limit(limit);
}

export async function getSubscription(subscriptionId: string) {
  const result = await db.execute(sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`);
  return result.rows[0] ?? null;
}

export async function runMonthlyGrant(): Promise<{ renewed: number; skipped: number }> {
  const tradies = await db
    .select({ id: usersTable.id, name: usersTable.name, welcomeGrantMonthsUsed: usersTable.welcomeGrantMonthsUsed })
    .from(usersTable)
    .where(eq(usersTable.role, "tradie"));

  let renewed = 0;
  let skipped = 0;

  for (const tradie of tradies) {
    try {
      await ensureWalletBalance(tradie.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const recentGrant = await db
        .select({ id: walletTransactionsTable.id })
        .from(walletTransactionsTable)
        .where(
          sql`${walletTransactionsTable.userId} = ${tradie.id}
            AND ${walletTransactionsTable.type} IN ('welcome_grant', 'subscription_grant')
            AND ${walletTransactionsTable.createdAt} >= ${startOfMonth.toISOString()}`,
        )
        .limit(1);

      if (recentGrant.length > 0) {
        skipped++;
        continue;
      }

      const monthsUsed = tradie.welcomeGrantMonthsUsed ?? 0;
      if (monthsUsed < 6) {
        const month = new Date().toLocaleString("en-AU", { month: "long", year: "numeric" });
        await grantWalletFunds(
          tradie.id,
          WELCOME_GRANT_CENTS,
          "welcome_grant",
          `Welcome offer — A$111.00 job lead credits for ${month}`,
        );
        await db
          .update(usersTable)
          .set({ welcomeGrantMonthsUsed: monthsUsed + 1 })
          .where(eq(usersTable.id, tradie.id));
        renewed++;
      } else {
        skipped++;
      }
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
