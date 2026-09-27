"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Auth is optional: if these aren't set (plain local dev), the app works as
// a single-user tool with no login, same as the original MVP.
export const authAvailable = Boolean(url && anonKey);

export const supabase = authAvailable ? createClient(url, anonKey) : null;
