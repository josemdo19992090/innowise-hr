"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";
import { useSession } from "@/lib/session";

export default function HomePage() {
  const { t } = useT();
  const { authAvailable, user, loading } = useSession();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm shadow-gray-200/60 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/15 blur-2xl"
        />
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">{t.homeEyebrow}</p>
        <h1 className="mt-2 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-4xl">{t.homeTitle}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">{t.homeLead}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/vacancy"
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30"
          >
            {t.homeCta}
          </Link>
          <Link
            href="/candidates"
            className="rounded-lg border border-gray-200 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t.homeCtaSecondary}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">{t.homeStepsTitle}</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2">
          {t.homeSteps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm shadow-gray-200/60"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{step.text}</p>
              <Link href={step.href} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
                {step.link} →
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm shadow-gray-200/60 sm:p-6">
        <h2 className="text-lg font-semibold">{t.homeGoodToKnow}</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-gray-600">
          {authAvailable && !loading && (
            <Note highlight={!user}>{user ? t.homeSignedInNote : t.homeGuestNote}</Note>
          )}
          {t.homeNotes.map((note) => (
            <Note key={note}>{note}</Note>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Note({ children, highlight = false }) {
  return (
    <li className={`flex gap-2.5 ${highlight ? "font-medium text-amber-800" : ""}`}>
      <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${highlight ? "bg-amber-500" : "bg-indigo-400"}`} />
      <span>{children}</span>
    </li>
  );
}
