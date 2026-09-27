import { updateDb, newId } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const key = await resolveStorageKey(req);
  const { candidateId, items } = await req.json().catch(() => ({}));
  if (!candidateId || !Array.isArray(items)) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const clean = items
    .map((i) => ({
      name: String(i.name || "").trim(),
      score: Number(i.score),
      notes: String(i.notes || "").trim(),
    }))
    .filter((i) => i.name);

  if (clean.length === 0) return Response.json({ error: "no_items" }, { status: 400 });
  if (clean.some((i) => !Number.isInteger(i.score) || i.score < 1 || i.score > 5)) {
    return Response.json({ error: "unscored_items" }, { status: 400 });
  }

  const interviewScore =
    Math.round((clean.reduce((s, i) => s + i.score, 0) / clean.length) * 100) / 100;

  const result = await updateDb(key, (db) => {
    if (!db.candidates.some((c) => c.id === candidateId)) return null;
    const interview = {
      id: newId(),
      candidateId,
      items: clean,
      interviewScore,
      createdAt: new Date().toISOString(),
    };
    db.interviews.push(interview);
    return interview;
  });

  if (!result) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ interview: result });
}
