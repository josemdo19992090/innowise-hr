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

  // Latest interview per candidate, same rule as the ranking table (a
  // second interview round replaces the first, it doesn't average with it).
  const latestInterview = {};
  for (const i of db.interviews) {
    const prev = latestInterview[i.candidateId];
    if (!prev || prev.createdAt < i.createdAt) latestInterview[i.candidateId] = i;
  }

  // CV score vs interview score, one row per candidate who's been through
  // both steps — the only place the two numbers sit side by side, so a
  // recruiter can see whether the CV screen is actually predicting how
  // people do face to face.
  const scoreComparison = db.candidates
    .filter((c) => latestInterview[c.id])
    .map((c) => ({
      name: c.extractedName,
      cvScore: c.cvScore,
      interviewScore: latestInterview[c.id].interviewScore,
      source: c.source || "ai",
    }))
    .sort((a, b) => b.cvScore - a.cvScore)
    .slice(0, 15);

  return Response.json({
    totalInterviews: db.interviews.length,
    totalCandidates: db.candidates.length,
    avgCvScore: avg(db.candidates.map((c) => c.cvScore)),
    avgInterviewScore: avg(db.interviews.map((i) => i.interviewScore)),
    weakestCompetencies: competencies,
    scoreComparison,
    vacancy: db.vacancy ? { summary: summarize(db.vacancy.description) } : null,
  });
}

// First meaningful line of the job description, as a reminder of which
// vacancy these numbers are about.
function summarize(description) {
  const firstLine = description.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
}
