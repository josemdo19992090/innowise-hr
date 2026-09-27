import { readDb, updateDb, newId } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// Lets a recruiter add a candidate by hand — same record shape as an
// AI-evaluated one (so every other page treats them identically) — for
// when Gemini is unavailable or quota-limited, or when they simply prefer
// to type it in themselves. Gated by an active vacancy just like the PDF
// upload, so a manual entry always has the same "evaluated against what?"
// context as an AI one.
export async function POST(req) {
  const key = await resolveStorageKey(req);
  const body = await req.json().catch(() => ({}));

  const { vacancy } = await readDb(key);
  if (!vacancy) return Response.json({ error: "no_vacancy" }, { status: 400 });

  const name = String(body.name || "").trim();
  const score = Math.round(Number(body.cvScore));
  if (!name) return Response.json({ error: "manual_missing_name" }, { status: 400 });
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    return Response.json({ error: "manual_bad_score" }, { status: 400 });
  }

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
    cvScore: score,
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
