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

  // Final ranking: every interviewed candidate, CV score and interview
  // score side by side, ordered by their average — the closest thing this
  // tool has to "who do we move forward with", built from both signals
  // instead of just the CV screen.
  const interviewRanking = db.candidates
    .filter((c) => latestInterview[c.id])
    .map((c) => {
      const interviewScore = latestInterview[c.id].interviewScore;
      return {
        id: c.id,
        name: c.extractedName,
        cvScore: c.cvScore,
        interviewScore,
        overallScore: Math.round((c.cvScore + interviewScore) / 2),
        source: c.source || "ai",
      };
    })
    .sort((a, b) => b.overallScore - a.overallScore);

  return Response.json({
    totalInterviews: db.interviews.length,
    totalCandidates: db.candidates.length,
    avgCvScore: avg(db.candidates.map((c) => c.cvScore)),
    avgInterviewScore: avg(db.interviews.map((i) => i.interviewScore)),
    weakestCompetencies: competencies,
    interviewRanking,
    vacancy: db.vacancy ? { summary: summarize(db.vacancy.description) } : null,
  });
}

// First meaningful line of the job description, as a reminder of which
// vacancy these numbers are about.
function summarize(description) {
  const firstLine = description.split("\n").map((l) => l.trim()).find(Boolean) || "";
  return firstLine.length > 120 ? `${firstLine.slice(0, 120)}…` : firstLine;
}
