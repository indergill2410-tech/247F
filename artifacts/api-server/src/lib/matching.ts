import { db } from "@workspace/db";
import {
  usersTable,
  tradieSkillsTable,
  claimsTable,
  notificationsTable,
  jobsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, and, count, inArray, sql } from "drizzle-orm";
import { logger } from "./logger.js";
import { sendNewJobMatchEmail } from "./email.js";

const MAX_CLAIMS_PER_JOB = 5;
const MAX_ACTIVE_JOBS_PER_TRADIE = 11;

/**
 * Approximate km distance between two AU postcodes.
 * Australian postcodes follow a rough geographic ordering within each state.
 * Conservative factor: 1 postcode unit ≈ 0.25 km in metro, more in rural.
 * We use 4 postcode units per km as a middle-ground approximation.
 */
const POSTCODE_UNITS_PER_KM = 4;

function postcodeDistanceKm(pc1: string, pc2: string): number | null {
  const a = parseInt(pc1, 10);
  const b = parseInt(pc2, 10);
  if (isNaN(a) || isNaN(b)) return null;
  // Must be same state (same leading digit in AU numbering)
  if (Math.floor(a / 1000) !== Math.floor(b / 1000)) return null;
  return Math.abs(a - b) / POSTCODE_UNITS_PER_KM;
}

/**
 * Determine whether a tradie's service-area preferences cover a given job location.
 *
 * Logic (OR):
 *   - "No preference" (no suburbs AND no radius) → always passes
 *   - serviceSuburbs set → job suburb must match one of them (case-insensitive)
 *   - serviceRadius set  → job postcode must be within approx. radius km of tradie postcode
 *   - Both set → either condition suffices
 */
function isInServiceArea(
  tradie: { serviceSuburbs: string[] | null; serviceRadius: number | null; postcode: string | null },
  jobSuburb: string | null,
  jobPostcode: string | null
): boolean {
  const hasSuburbPrefs = tradie.serviceSuburbs && tradie.serviceSuburbs.length > 0;
  const hasRadiusPref = tradie.serviceRadius != null && tradie.serviceRadius > 0;

  // No preferences → all areas
  if (!hasSuburbPrefs && !hasRadiusPref) return true;

  // Suburb match (case-insensitive exact)
  if (hasSuburbPrefs && jobSuburb) {
    const jobSuburbLower = jobSuburb.toLowerCase();
    if (tradie.serviceSuburbs!.some((s) => s.toLowerCase() === jobSuburbLower)) {
      return true;
    }
  }

  // Radius match (postcode-distance approximation)
  if (hasRadiusPref && tradie.postcode && jobPostcode) {
    const distKm = postcodeDistanceKm(tradie.postcode, jobPostcode);
    if (distKm !== null && distKm <= tradie.serviceRadius!) {
      return true;
    }
  }

  // Had at least one preference but neither matched
  return false;
}

export async function runMatchingEngine(
  jobId: number,
  categoryId: number,
  postcode: string | null,
  suburb: string | null
): Promise<void> {
  try {
    // Find tradies with matching skills
    const tradiesWithSkill = await db
      .select({ tradieId: tradieSkillsTable.tradieId })
      .from(tradieSkillsTable)
      .where(eq(tradieSkillsTable.categoryId, categoryId));

    if (tradiesWithSkill.length === 0) {
      logger.info({ jobId }, "No tradies with matching skill found");
      return;
    }

    const tradieIds = tradiesWithSkill.map((t) => t.tradieId);

    // Get active job counts per tradie
    const activeCounts = await db
      .select({
        tradieId: claimsTable.tradieId,
        activeCount: count(claimsTable.id),
      })
      .from(claimsTable)
      .where(
        and(
          inArray(claimsTable.tradieId, tradieIds),
          inArray(claimsTable.status, ["pending", "accepted"])
        )
      )
      .groupBy(claimsTable.tradieId);

    const activeCountMap = new Map(activeCounts.map((r) => [r.tradieId, r.activeCount]));

    // Filter tradies who haven't hit the active job limit
    const eligibleIds = tradieIds.filter((id) => {
      const active = Number(activeCountMap.get(id) ?? 0);
      return active < MAX_ACTIVE_JOBS_PER_TRADIE;
    });

    if (eligibleIds.length === 0) {
      logger.info({ jobId }, "All matching tradies are at capacity");
      return;
    }

    // Get tradie details including full service area preferences
    const tradies = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        rating: usersTable.rating,
        postcode: usersTable.postcode,
        isActive: usersTable.isActive,
        serviceSuburbs: usersTable.serviceSuburbs,
        serviceRadius: usersTable.serviceRadius,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.id, eligibleIds), eq(usersTable.isActive, true)));

    // Service area filter: suburb match OR radius match, with no-preference passthrough
    const serviceAreaFiltered = tradies.filter((tradie) =>
      isInServiceArea(tradie, suburb, postcode)
    );

    if (serviceAreaFiltered.length === 0) {
      logger.info({ jobId, suburb, postcode }, "No tradies within service area for this job");
      return;
    }

    // Score by rating (primary), postcode proximity (secondary tiebreaker)
    const scored = serviceAreaFiltered.map((tradie) => {
      let score = tradie.rating ?? 3.0;
      if (postcode && tradie.postcode) {
        if (tradie.postcode === postcode) {
          score += 0.5;
        } else if (tradie.postcode.slice(0, 2) === postcode.slice(0, 2)) {
          score += 0.2;
        }
      }
      return { ...tradie, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, MAX_CLAIMS_PER_JOB);

    // Fetch job info (title, urgency, category) for email content
    const [jobRow] = await db
      .select({
        title: jobsTable.title,
        urgency: jobsTable.urgency,
        categoryName: categoriesTable.name,
      })
      .from(jobsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
      .where(eq(jobsTable.id, jobId));

    // Create in-app notifications for matched tradies
    const notificationInserts = selected.map((tradie) => ({
      userId: tradie.id,
      type: "job_match",
      title: "New Job Match",
      message: `A new job matching your skills is available${suburb ? ` in ${suburb}` : ""}. Be one of the first to claim it!`,
      jobId,
    }));

    await db.insert(notificationsTable).values(notificationInserts);

    // Fire-and-forget email notifications (never blocks the matching flow)
    if (jobRow) {
      for (const tradie of selected) {
        sendNewJobMatchEmail({
          tradieEmail: tradie.email,
          tradieName: tradie.name,
          jobTitle: jobRow.title,
          jobId,
          categoryName: jobRow.categoryName ?? null,
          urgency: jobRow.urgency,
          suburb,
        }).catch(() => {});
      }
    }

    // Only transition to "matched" when at least one tradie was notified
    await db
      .update(jobsTable)
      .set({ status: "matched", updatedAt: sql`NOW()` })
      .where(eq(jobsTable.id, jobId));

    logger.info(
      {
        jobId,
        matchedCount: selected.length,
        serviceAreaFiltered: serviceAreaFiltered.length,
        totalEligible: tradies.length,
      },
      "Matching engine completed"
    );
  } catch (err) {
    logger.error({ err, jobId }, "Matching engine error");
  }
}
