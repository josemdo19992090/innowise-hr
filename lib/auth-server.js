import { createClient } from "@supabase/supabase-js";

let adminClient;
function getAdminClient() {
  if (!adminClient) {
    adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return adminClient;
}

// Turns a request into the storage key its data lives under: the verified
// user id for a logged-in recruiter, a plain guest id for anonymous use, or
// null when Supabase isn't configured at all (plain local dev — db.js falls
// back to a single shared file, same as the original single-user MVP).
export class AuthError extends Error {}

export async function resolveStorageKey(req) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!configured) return null;

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const { data, error } = await getAdminClient().auth.getUser(token);
    if (!error && data.user) return `user:${data.user.id}`;
    // A bearer token was sent but rejected (expired/invalid): the client
    // believes it's signed in and never sends x-guest-id in that case, so
    // falling through to a guest/anonymous key would silently read and
    // write into a bucket shared by every other request in the same state
    // — mixing one user's data with another's. Fail closed instead.
    throw new AuthError("Invalid or expired session token");
  }

  const guestId = req.headers.get("x-guest-id");
  if (guestId) return `guest:${guestId}`;

  return "anonymous"; // no identity sent at all — shouldn't normally happen, but keep requests working
}

// Convenience for route handlers: resolves the storage key, or returns a
// ready-to-return 401 Response if the identity couldn't be resolved (see
// AuthError above). Usage: `const r = await requireStorageKey(req); if (r.error) return r.error;`
export async function requireStorageKey(req) {
  try {
    return { key: await resolveStorageKey(req) };
  } catch (err) {
    if (err instanceof AuthError) return { error: Response.json({ error: "auth_failed" }, { status: 401 }) };
    throw err;
  }
}
