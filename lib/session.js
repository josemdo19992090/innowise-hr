"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase, authAvailable } from "./supabaseClient";

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(authAvailable);

  // Identifies a guest's work for the life of this tab only: generated fresh
  // in memory on every load, never written to any browser storage, so a
  // reload orphans the previous guest data — it's gone from their view,
  // which is exactly "se borra al reiniciar la página".
  const [guestId] = useState(() => (typeof crypto !== "undefined" ? crypto.randomUUID() : String(Math.random())));

  useEffect(() => {
    if (!authAvailable) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAccessToken(data.session?.access_token ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      authAvailable,
      user,
      loading,
      isGuest: !user,
      signUp: (email, password) => supabase.auth.signUp({ email, password }),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
      // Attach to every API call so the server knows whose data to read/write.
      identityHeaders: () =>
        accessToken ? { Authorization: `Bearer ${accessToken}` } : { "x-guest-id": guestId },
    }),
    [user, accessToken, guestId, loading]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

// Drop-in replacement for fetch() that stamps every request with the
// current user's or guest's identity, so pages don't each repeat this.
// Stable across re-renders (only changes when the identity actually does)
// so it's safe to use as a useCallback/useEffect dependency.
//
// While the session is still resolving (loading), it deliberately returns a
// promise that never settles instead of firing a request under a guessed
// (guest) identity. Without this, a page's load-on-mount effect can fire
// once as a guest and again moments later once the real user is known; if
// the guest response — always empty — resolves after the real one, it wins
// the race and silently blanks out the page. Once loading flips to false,
// this function's identity changes, which re-runs any effect that depends
// on it, firing the one real request.
export function useApiFetch() {
  const { identityHeaders, loading } = useSession();
  return useCallback(
    (url, options = {}) => {
      if (loading) return new Promise(() => {});
      return fetch(url, { ...options, headers: { ...identityHeaders(), ...(options.headers || {}) } });
    },
    [identityHeaders, loading]
  );
}
