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

const MAX_CLAIMS_PER_JOB = 5;
const MAX_ACTIVE_JOBS_PER_TRADIE = 11;

export async function runMatchingEngine(
  jobId: number,
  categoryId: number,
  postcode: string | null
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

    // Get tradie details, sort by rating desc (proximity scoring with postcode later)
    const tradies = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        rating: usersTable.rating,
        postcode: usersTable.postcode,
        isActive: usersTable.isActive,
      })
      .from(usersTable)
      .where(and(inArray(usersTable.id, eligibleIds), eq(usersTable.isActive, true)));

    // Score tradies: rating (primary), postcode proximity (secondary)
    const scored = tradies.map((tradie) => {
      let score = tradie.rating ?? 3.0;
      // Basic postcode proximity: same postcode = +2 pts, share 2 digits = +1 pt
      if (postcode && tradie.postcode) {
        if (tradie.postcode === postcode) {
          score += 2;
        } else if (tradie.postcode.slice(0, 2) === postcode.slice(0, 2)) {
          score += 1;
        }
      }
      return { ...tradie, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const selected = scored.slice(0, MAX_CLAIMS_PER_JOB);

    // Create notifications for matched tradies
    const notificationInserts = selected.map((tradie) => ({
      userId: tradie.id,
      type: "job_match",
      title: "New Job Match",
      message: `A new job matching your skills is available. Be one of the first to claim it!`,
      jobId,
    }));

    if (notificationInserts.length > 0) {
      await db.insert(notificationsTable).values(notificationInserts);
    }

    // Update job status to matched
    await db
      .update(jobsTable)
      .set({ status: "matched", updatedAt: sql`NOW()` })
      .where(eq(jobsTable.id, jobId));

    logger.info({ jobId, matchedCount: selected.length }, "Matching engine completed");
  } catch (err) {
    logger.error({ err, jobId }, "Matching engine error");
  }
}
