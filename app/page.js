"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT, errorText } from "@/lib/i18n";

export default function VacancyPage() {
  const { t, lang } = useT();
  const [description, setDescription] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetch("/api/vacancy")
      .then((r) => r.json())
      .then(({ vacancy }) => {
        if (vacancy) {
          setDescription(vacancy.description);
          setUpdatedAt(vacancy.updatedAt);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setMessage(null);
    if (!description.trim()) return setMessage({ type: "error", text: t.vacancyEmpty });
    setSaving(true);
    try {
      const res = await fetch("/api/vacancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) throw data;
      setUpdatedAt(data.vacancy.updatedAt);
      setMessage({ type: "ok", text: t.vacancySaved });
    } catch (err) {
      setMessage({ type: "error", text: errorText(t, err?.error ? err : { error: "network" }) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.vacancyTitle}</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-600">{t.vacancyHint}</p>
      </div>

      <div className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={loading ? t.loading : t.vacancyPlaceholder}
          disabled={loading}
          rows={14}
          className="w-full resize-y rounded-lg border border-gray-300 p-3 text-base leading-relaxed sm:text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={save}
            disabled={saving || loading}
            className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-600/20 transition hover:shadow-lg hover:shadow-indigo-600/30 disabled:opacity-50"
          >
            {saving ? t.vacancySaving : t.vacancySave}
          </button>
          {updatedAt && (
            <span className="text-xs text-gray-500">
              {t.vacancyUpdated}: {new Date(updatedAt).toLocaleString(lang === "ru" ? "ru-RU" : "en-GB")}
            </span>
          )}
          {message && (
            <span className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</span>
          )}
          {updatedAt && (
            <Link href="/candidates" className="ml-auto text-sm font-medium text-indigo-600 hover:underline">
              {t.vacancyNext}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
