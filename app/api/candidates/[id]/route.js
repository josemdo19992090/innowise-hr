import { readDb } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = await params;
  const key = await resolveStorageKey(req);
  const db = await readDb(key);
  const candidate = db.candidates.find((c) => c.id === id);
  if (!candidate) return Response.json({ error: "not_found" }, { status: 404 });
  const interviews = db.interviews
    .filter((i) => i.candidateId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ candidate, interviews });
}
