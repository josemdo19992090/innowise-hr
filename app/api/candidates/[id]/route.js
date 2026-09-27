import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const { id } = await params;
  const db = await readDb();
  const candidate = db.candidates.find((c) => c.id === id);
  if (!candidate) return Response.json({ error: "not_found" }, { status: 404 });
  const interviews = db.interviews
    .filter((i) => i.candidateId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return Response.json({ candidate, interviews });
}
