import { readDb, updateDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await readDb();
  return Response.json({ vacancy: db.vacancy });
}

export async function POST(req) {
  const { description } = await req.json().catch(() => ({}));
  if (!description || !description.trim()) {
    return Response.json({ error: "empty_description" }, { status: 400 });
  }
  const vacancy = await updateDb((db) => {
    db.vacancy = { description: description.trim(), updatedAt: new Date().toISOString() };
    return db.vacancy;
  });
  return Response.json({ vacancy });
}
