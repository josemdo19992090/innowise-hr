"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";

export default function Nav() {
  const { t, lang, setLang } = useT();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t.navVacancy, active: pathname === "/" },
    { href: "/candidates", label: t.navCandidates, active: pathname.startsWith("/candidates") },
    { href: "/stats", label: t.navStats, active: pathname === "/stats" },
  ];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">HR</span>
          <span>{t.appName}</span>
        </Link>
        <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
                l.active ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex rounded-md border border-gray-200 p-0.5 text-xs font-semibold">
          {["ru", "en"].map((code) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              aria-pressed={lang === code}
              className={`rounded px-2.5 py-1 uppercase ${
                lang === code ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {code}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
