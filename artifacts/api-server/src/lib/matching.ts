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
import { haversineKm, estimateLatLng } from "./geo.js";

const MAX_CLAIMS_PER_JOB = 5;
const MAX_ACTIVE_JOBS_PER_TRADIE = 11;

/**
 * Determine whether a tradie's service-area preferences cover a given job location.
 *
 * Logic (OR — either condition suffices):
 *   - No preferences (no suburbs AND no radius) → passes (all areas)
 *   - serviceSuburbs set → job suburb must match one entry (case-insensitive)
 *   - serviceRadius set  → job must be within radius km of tradie (haversine)
 */
function isInServiceArea(
  tradie: {
    serviceSuburbs: string[] | null;
    serviceRadius: number | null;
    latitude: number | null;
    longitude: number | null;
    postcode: string | null;
  },
  jobSuburb: string | null,
  jobLatitude: number | null,
  jobLongitude: number | null,
  jobPostcode: string | null
): boolean {
  const hasSuburbPrefs = tradie.serviceSuburbs && tradie.serviceSuburbs.length > 0;
  const hasRadiusPref = tradie.serviceRadius != null && tradie.serviceRadius > 0;

  // No preferences → all areas
  if (!hasSuburbPrefs && !hasRadiusPref) return true;

  // Suburb exact match (case-insensitive)
  if (hasSuburbPrefs && jobSuburb) {
    const jobLower = jobSuburb.toLowerCase();
    if (tradie.serviceSuburbs!.some((s) => s.toLowerCase() === jobLower)) {
      return true;
    }
  }

  // Radius match using haversine (prefer stored coordinates, fall back to postcode estimate)
  if (hasRadiusPref) {
    let tradieLat = tradie.latitude;
    let tradieLng = tradie.longitude;
    let jobLat = jobLatitude;
    let jobLng = jobLongitude;

    // Fall back to postcode-estimated coordinates when stored values are absent
    if ((tradieLat == null || tradieLng == null) && tradie.postcode) {
      const est = estimateLatLng(tradie.postcode);
      if (est) { tradieLat = est.lat; tradieLng = est.lng; }
    }
    if ((jobLat == null || jobLng == null) && jobPostcode) {
      const est = estimateLatLng(jobPostcode);
      if (est) { jobLat = est.lat; jobLng = est.lng; }
    }

    if (tradieLat != null && tradieLng != null && jobLat != null && jobLng != null) {
      const distKm = haversineKm(tradieLat, tradieLng, jobLat, jobLng);
      if (distKm <= tradie.serviceRadius!) {
        return true;
      }
    }
  }

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

    const eligibleIds = tradieIds.filter((id) => {
      const active = Number(activeCountMap.get(id) ?? 0);
      return active < MAX_ACTIVE_JOBS_PER_TRADIE;
    });

    if (eligibleIds.length === 0) {
      logger.info({ jobId }, "All matching tradies are at capacity");
      return;
    }

    // Fetch job row: title, urgency, category name, and stored coordinates
    const [jobRow] = await db
      .select({
        title: jobsTable.title,
        urgency: jobsTable.urgency,
        latitude: jobsTable.latitude,
        longitude: jobsTable.longitude,
        categoryName: categoriesTable.name,
      })
      .from(jobsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, jobsTable.categoryId))
      .where(eq(jobsTable.id, jobId));

    if (!jobRow) {
      logger.warn({ jobId }, "Job not found in matching engine");
      return;
    }

    // Get tradie details including service area preferences and coordinates
    const tradies = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        rating: usersTable.rating,
        postcode: usersTable.postcode,
        latitude: usersTable.latitude,
        longitude: usersTable.longitude,
        isActive: usersTable.isActive,
        serviceSuburbs: usersTable.serviceSuburbs,
        serviceRadius: usersTable.serviceRadius,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.id, eligibleIds), eq(usersTable.isActive, true)));

    // Service area filter: suburb match OR haversine radius match
    const serviceAreaFiltered = tradies.filter((tradie) =>
      isInServiceArea(
        tradie,
        suburb,
        jobRow.latitude ?? null,
        jobRow.longitude ?? null,
        postcode
      )
    );

    if (serviceAreaFiltered.length === 0) {
      logger.info({ jobId, suburb, postcode }, "No tradies within service area — job stays open");
      return;
    }

    // Score by rating only (service area is already enforced by filter above)
    const scored = serviceAreaFiltered
      .map((tradie) => ({ ...tradie, score: tradie.rating ?? 3.0 }))
      .sort((a, b) => b.score - a.score);

    const selected = scored.slice(0, MAX_CLAIMS_PER_JOB);

    // Create in-app notifications
    await db.insert(notificationsTable).values(
      selected.map((tradie) => ({
        userId: tradie.id,
        type: "job_match",
        title: "New Job Match",
        message: `A new job matching your skills is available${suburb ? ` in ${suburb}` : ""}. Be one of the first to claim it!`,
        jobId,
      }))
    );

    // Fire-and-forget email notifications
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

    // Only mark as matched when at least one tradie was notified
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
