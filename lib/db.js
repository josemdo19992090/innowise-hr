import { promises as fs } from "fs";
import path from "path";

const EMPTY_DB = { vacancy: null, candidates: [], interviews: [] };
const ROW_KEY = "hr-scout";

// Vercel's filesystem is read-only in production, so storage is picked at
// runtime: Supabase (a single jsonb row) when it's configured (deployed), a
// local JSON file otherwise (plain `npm run dev`). Same shape either way.
const useSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabasePromise;
async function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    );
  }
  return supabasePromise;
}

// Several CVs are processed in parallel, so writes are serialized through a
// single promise chain to avoid read-modify-write races. This only
// serializes calls within one running instance — fine for this MVP's single
// recruiter working from one browser tab at a time; it would need a real
// lock (or a DB transaction) under real concurrent multi-user writes.
const lock = (globalThis.__dbLock ??= { chain: Promise.resolve() });

async function loadRaw() {
  if (useSupabase) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from("kv_store").select("value").eq("key", ROW_KEY).maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return data?.value || null;
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
  if (useSupabase) {
    const supabase = await getSupabase();
    const { error } = await supabase.from("kv_store").upsert({ key: ROW_KEY, value: db });
    if (error) throw new Error(`Supabase write failed: ${error.message}`);
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
