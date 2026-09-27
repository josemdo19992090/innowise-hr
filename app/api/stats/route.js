import { readDb } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";
import { groupCompetencies } from "@/lib/competencies";

export const dynamic = "force-dynamic";

const avg = (nums) => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null);

export async function GET(req) {
  const key = await resolveStorageKey(req);
  const db = await readDb(key);

  const items = db.interviews.flatMap((interview) => interview.items);
  const competencies = groupCompetencies(items)
    .sort((a, b) => a.average - b.average || b.count - a.count)
    .slice(0, 10);

  return Response.json({
    totalInterviews: db.interviews.length,
    totalCandidates: db.candidates.length,
    avgCvScore: avg(db.candidates.map((c) => c.cvScore)),
    avgInterviewScore: avg(db.interviews.map((i) => i.interviewScore)),
    weakestCompetencies: competencies,
    vacancy: db.vacancy ? { summary: summarize(db.vacancy.description) } : null,
  });
}

// First meaningful line of the job description, as a reminder of which
// vacancy these numbers are about.
function summarize(description) {
  const firstLine = description.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
}
