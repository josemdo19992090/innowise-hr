import { promises as fs } from "fs";
import path from "path";

const EMPTY_DB = { vacancy: null, candidates: [], interviews: [] };
const LOCAL_KEY = "hr-scout"; // used when Supabase isn't configured (plain `npm run dev`, no login)

// Vercel's filesystem is read-only in production, so storage is picked at
// runtime: Supabase (one jsonb row per storage key) when it's configured
// (deployed), a local JSON file otherwise. Each caller passes the storage
// key resolved by lib/auth-server.js — a logged-in user's id, a guest id,
// or null (falls back to a single shared local key, matching the original
// single-user MVP when Supabase isn't set up at all).
const useSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let supabasePromise;
async function getSupabase() {
  if (!supabasePromise) {
    supabasePromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    );
  }
  return supabasePromise;
}

// Several requests can land in parallel (e.g. CVs uploaded together), so
// writes are serialized per key through a promise chain to avoid
// read-modify-write races. This only serializes calls within one running
// instance — fine for this MVP's single recruiter working from one browser
// tab at a time; it would need a real lock (or a DB transaction) under real
// concurrent multi-tab writes from the same account.
const locks = (globalThis.__dbLocks ??= new Map());
function lockFor(key) {
  if (!locks.has(key)) locks.set(key, Promise.resolve());
  return locks.get(key);
}

async function loadRaw(key) {
  if (useSupabase) {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from("kv_store").select("value").eq("key", key).maybeSingle();
    if (error) throw new Error(`Supabase read failed: ${error.message}`);
    return data?.value || null;
  }
  const DB_PATH = path.join(process.cwd(), "data", `${key}.json`);
  try {
    return JSON.parse(await fs.readFile(DB_PATH, "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return null;
    throw err;
  }
}

async function saveRaw(key, db) {
  if (useSupabase) {
    const supabase = await getSupabase();
    const { error } = await supabase.from("kv_store").upsert({ key, value: db });
    if (error) throw new Error(`Supabase write failed: ${error.message}`);
    return;
  }
  const DB_PATH = path.join(process.cwd(), "data", `${key}.json`);
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

export async function readDb(key = LOCAL_KEY) {
  const raw = await loadRaw(key);
  return raw ? { ...EMPTY_DB, ...raw } : structuredClone(EMPTY_DB);
}

export function updateDb(key = LOCAL_KEY, mutate) {
  const run = lockFor(key).then(async () => {
    const db = await readDb(key);
    const result = await mutate(db);
    await saveRaw(key, db);
    return result;
  });
  locks.set(key, run.catch(() => {}));
  return run;
}

export function newId() {
  return crypto.randomUUID();
}
