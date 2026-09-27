import { readDb, updateDb } from "@/lib/db";
import { resolveStorageKey } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const key = await resolveStorageKey(req);
  const db = await readDb(key);
  return Response.json({ vacancy: db.vacancy });
}

export async function POST(req) {
  const key = await resolveStorageKey(req);
  const { description } = await req.json().catch(() => ({}));
  if (!description || !description.trim()) {
    return Response.json({ error: "empty_description" }, { status: 400 });
  }
  const vacancy = await updateDb(key, (db) => {
    db.vacancy = { description: description.trim(), updatedAt: new Date().toISOString() };
    return db.vacancy;
  });
  return Response.json({ vacancy });
}
