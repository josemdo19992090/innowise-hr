"use client";

import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function AuthWidget() {
  const { t } = useT();
  const { authAvailable, user, loading, signIn, signUp, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const panelRef = useRef(null);

  if (!authAvailable || loading) return null;

  function closePanel() {
    setOpen(false);
    setError(null);
    setNotice(null);
    setPassword("");
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: err } =
      mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (err) return setError(t.authErrorGeneric);
    if (mode === "signup") {
      setNotice(t.authCheckEmail);
      return;
    }
    closePanel();
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden max-w-[10rem] truncate text-xs text-gray-500 sm:inline" title={user.email}>
          {t.authSignedInAs} {user.email}
        </span>
        <button
          onClick={() => signOut()}
          className="whitespace-nowrap rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
        >
          {t.authSignOut}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => (open ? closePanel() : setOpen(true))}
        className="whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800"
      >
        {t.authSignIn}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={closePanel} />
          <div
            ref={panelRef}
            className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
          >
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t.authEmail}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t.authPassword}</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:text-sm"
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              {notice && <p className="text-xs text-green-700">{notice}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 disabled:opacity-50"
              >
                {mode === "signin" ? t.authSubmitSignIn : t.authSubmitSignUp}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setNotice(null);
                }}
                className="w-full text-center text-xs text-indigo-600 hover:underline"
              >
                {mode === "signin" ? t.authSwitchToSignUp : t.authSwitchToSignIn}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
