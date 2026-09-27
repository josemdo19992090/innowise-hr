import { promises as fs } from "fs";
import path from "path";

const EMPTY_DB = { vacancy: null, candidates: [], interviews: [] };
const KV_KEY = "hr-scout:db";

// Vercel's filesystem is read-only in production, so storage is picked at
// runtime: Vercel KV when it's configured (deployed), a local JSON file
// otherwise (plain `npm run dev`). Same shape either way.
const useKv = Boolean(process.env.KV_REST_API_URL);

// Several CVs are processed in parallel, so writes are serialized through a
// single promise chain to avoid read-modify-write races. This only
// serializes calls within one running instance — fine for this MVP's single
// recruiter working from one browser tab at a time; it would need a real
// lock (or KV transactions) under real concurrent multi-user writes.
const lock = (globalThis.__dbLock ??= { chain: Promise.resolve() });

async function loadRaw() {
  if (useKv) {
    const { kv } = await import("@vercel/kv");
    const data = await kv.get(KV_KEY);
    return data || null;
  }
  const DB_PATH = path.join(process.cwd(), "data", "db.json");
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function saveRaw(db) {
  if (useKv) {
    const { kv } = await import("@vercel/kv");
    await kv.set(KV_KEY, db);
    return;
  }
  const DB_PATH = path.join(process.cwd(), "data", "db.json");
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function readDb() {
  const raw = await loadRaw();
  return raw ? { ...EMPTY_DB, ...raw } : structuredClone(EMPTY_DB);
}

export function updateDb(mutate) {
  const run = lock.chain.then(async () => {
    const db = await readDb();
    const result = await mutate(db);
    await saveRaw(db);
    return result;
  });
  lock.chain = run.catch(() => {});
  return run;
}

export function newId() {
  return crypto.randomUUID();
}
