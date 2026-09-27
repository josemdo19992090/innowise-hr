import { readDb } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

export async function GET(req) {
  const key = await resolveStorageKey(req);
  const db = await readDb(key);

  // Group interview items by normalized competency name so "SQL" and " sql "
  // count as the same skill; keep the first spelling seen for display.
  const groups = new Map();
  for (const interview of db.interviews) {
    for (const item of interview.items) {
      const groupKey = item.name.trim().toLowerCase().replace(/\s+/g, " ");
      if (!groups.has(groupKey)) groups.set(groupKey, { name: item.name.trim(), scores: [] });
      groups.get(groupKey).scores.push(item.score);
    }
  }

  const competencies = [...groups.values()]
    .map((g) => ({ name: g.name, average: avg(g.scores), count: g.scores.length }))
    .sort((a, b) => a.average - b.average || b.count - a.count)
    .slice(0, 10);

  return Response.json({
    totalInterviews: db.interviews.length,
    totalCandidates: db.candidates.length,
    avgCvScore: avg(db.candidates.map((c) => c.cvScore)),
    avgInterviewScore: avg(db.interviews.map((i) => i.interviewScore)),
    weakestCompetencies: competencies,
  });
}
