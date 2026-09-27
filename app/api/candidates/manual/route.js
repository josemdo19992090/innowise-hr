import { readDb, updateDb, newId } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// Lets a recruiter add a candidate by hand — same record shape as an
// AI-evaluated one (so every other page treats them identically) — for
// when Gemini is unavailable or quota-limited, or when they simply prefer
// to type it in themselves. Gated by an active vacancy just like the PDF
// upload, so a manual entry always has the same "evaluated against what?"
// context as an AI one.
//
// The 0–100 score is never taken as a raw number from the client: it's
// computed here from a set of criteria (name + 1–10 rating, "1 knows
// nothing" .. "10 expert"), same idea as the interview checklist, so it's
// backed by something a recruiter can look back at instead of a single
// subjective figure.
export async function POST(req) {
  const key = await resolveStorageKey(req);
  const body = await req.json().catch(() => ({}));

  const { vacancy } = await readDb(key);
  if (!vacancy) return Response.json({ error: "no_vacancy" }, { status: 400 });

  const name = String(body.name || "").trim();
  if (!name) return Response.json({ error: "manual_missing_name" }, { status: 400 });

  const criteria = (Array.isArray(body.criteria) ? body.criteria : [])
    .map((c) => ({ name: String(c?.name || "").trim(), score: Math.round(Number(c?.score)) }))
    .filter((c) => c.name);
  if (!criteria.length) return Response.json({ error: "manual_no_criteria" }, { status: 400 });
  if (criteria.some((c) => !Number.isInteger(c.score) || c.score < 1 || c.score > 10)) {
    return Response.json({ error: "manual_unscored_criteria" }, { status: 400 });
  }

  const cvScore = Math.round((criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length) * 10);

  const toList = (text) =>
    String(text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const candidate = {
    id: newId(),
    // Set when this rescues a PDF whose AI evaluation failed, so the file
    // stays referenced even though it was never parsed; null for a fully
    // manual entry with no file at all.
    fileName: body.fileName ? String(body.fileName) : null,
    source: "manual",
    extractedName: name,
    cvScore,
    manualCriteria: criteria,
    summary: String(body.summary || "").trim(),
    strengths: toList(body.strengths),
    weaknesses: toList(body.weaknesses),
    suggestedChecklist: [],
    createdAt: new Date().toISOString(),
  };

  await updateDb(key, (db) => {
    db.candidates.push(candidate);
  });
  return Response.json({ candidate });
}
