import { readDb, updateDb } from "@/lib/db";
import { requireStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  const { id } = await params;
  const r = await requireStorageKey(req);
  if (r.error) return r.error;
  const db = await readDb(r.key);
  const candidate = db.candidates.find((c) => c.id === id);
  if (!candidate) return Response.json({ error: "not_found" }, { status: 404 });
  const interviews = db.interviews
    .filter((i) => i.candidateId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ candidate, interviews });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const r = await requireStorageKey(req);
  if (r.error) return r.error;
  const existed = await updateDb(r.key, (db) => {
    const before = db.candidates.length;
    db.candidates = db.candidates.filter((c) => c.id !== id);
    db.interviews = db.interviews.filter((i) => i.candidateId !== id);
    return db.candidates.length !== before;
  });
  if (!existed) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ ok: true });
}
