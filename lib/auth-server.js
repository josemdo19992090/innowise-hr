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
export async function resolveStorageKey(req) {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!configured) return null;

  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (token) {
    const { data, error } = await getAdminClient().auth.getUser(token);
    if (!error && data.user) return `user:${data.user.id}`;
  }

  const guestId = req.headers.get("x-guest-id");
  if (guestId) return `guest:${guestId}`;

  return "anonymous"; // no identity sent at all — shouldn't normally happen, but keep requests working
}
