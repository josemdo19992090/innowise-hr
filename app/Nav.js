"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";
import AuthWidget from "./AuthWidget";

export default function Nav() {
  const { t, lang, setLang } = useT();
  const { authAvailable, user, loading } = useSession();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t.navVacancy, active: pathname === "/" },
    { href: "/candidates", label: t.navCandidates, active: pathname.startsWith("/candidates") },
    { href: "/stats", label: t.navStats, active: pathname === "/stats" },
  ];

  const showGuestNotice = authAvailable && !loading && !user;

  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
            IH
          </span>
          <span className="text-gray-900">{t.appName}</span>
        </Link>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                l.active
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <AuthWidget />
          <div className="flex rounded-md border border-gray-200 bg-white p-0.5 text-xs font-semibold">
            {["ru", "en"].map((code) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className={`rounded px-3 py-1.5 uppercase transition-colors ${
                  lang === code
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>
      {showGuestNotice && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800">
          {t.authGuestNotice}
        </div>
      )}
    </header>
  );
}
