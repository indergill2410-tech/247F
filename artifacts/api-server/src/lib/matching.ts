import { db } from "@workspace/db";
import {
  usersTable,
  tradieSkillsTable,
  claimsTable,
  notificationsTable,
  jobsTable,
} from "@workspace/db";
import { eq, and, count, inArray, sql } from "drizzle-orm";
import { logger } from "./logger.js";
import { sendNewJobMatchEmail } from "./email.js";

const MAX_CLAIMS_PER_JOB = 5;
const MAX_ACTIVE_JOBS_PER_TRADIE = 11;

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

    // Get tradie details including service area preferences
    const tradies = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        rating: usersTable.rating,
        postcode: usersTable.postcode,
        isActive: usersTable.isActive,
        serviceSuburbs: usersTable.serviceSuburbs,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.id, eligibleIds), eq(usersTable.isActive, true)));

    // Service area filter: if tradie has serviceSuburbs, check if job's suburb matches.
    // Tradies with no service suburb preferences receive all notifications.
    const jobSuburbLower = suburb?.toLowerCase() ?? null;
    const serviceAreaFiltered = tradies.filter((tradie) => {
      const prefs = tradie.serviceSuburbs;
      if (!prefs || prefs.length === 0) return true; // no preference = all areas
      if (!jobSuburbLower) return true; // no job suburb = can't filter
      return prefs.some((s) => s.toLowerCase() === jobSuburbLower);
    });

    // Score by rating (primary), postcode proximity (secondary, as tiebreaker)
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

    // Fetch job info for email content
    const [jobRow] = await db
      .select({
        title: jobsTable.title,
        urgency: jobsTable.urgency,
      })
      .from(jobsTable)
      .where(eq(jobsTable.id, jobId));

    // Create in-app notifications for matched tradies
    const notificationInserts = selected.map((tradie) => ({
      userId: tradie.id,
      type: "job_match",
      title: "New Job Match",
      message: `A new job matching your skills is available${suburb ? ` in ${suburb}` : ""}. Be one of the first to claim it!`,
      jobId,
    }));

    if (notificationInserts.length > 0) {
      await db.insert(notificationsTable).values(notificationInserts);
    }

    // Fire-and-forget email notifications (no await, never blocks matching)
    if (jobRow) {
      for (const tradie of selected) {
        sendNewJobMatchEmail({
          tradieEmail: tradie.email,
          tradieName: tradie.name,
          jobTitle: jobRow.title,
          jobId,
          categoryName: null,
          urgency: jobRow.urgency,
          suburb,
        }).catch(() => {});
      }
    }

    // Update job status to matched
    await db
      .update(jobsTable)
      .set({ status: "matched", updatedAt: sql`NOW()` })
      .where(eq(jobsTable.id, jobId));

    logger.info(
      { jobId, matchedCount: selected.length, filteredCount: tradies.length - serviceAreaFiltered.length },
      "Matching engine completed"
    );
  } catch (err) {
    logger.error({ err, jobId }, "Matching engine error");
  }
}
