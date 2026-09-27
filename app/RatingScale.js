// Shared rating control — used by the interview checklist (1–5, a label
// under every button) and by the manual CV-evaluation criteria (1–10, too
// many buttons for a per-button label to fit, so only the defined anchor
// points get one, shown as a legend above the row instead).
//
// `labels`: an array with one entry per point (1..max) — every button gets
// its own label under it. Use for small scales (e.g. 1–5).
// `anchors`: a sparse map like {1: "...", 5: "...", 10: "..."} — only those
// points are named, shown once above the row instead of repeated per
// button. Use for larger scales (e.g. 1–10) where per-button labels don't fit.
export default function RatingScale({ value, onChange, max = 5, labels, anchors }) {
  const points = Array.from({ length: max }, (_, i) => i + 1);
  const titleFor = (n) => labels?.[n - 1] || anchors?.[n] || String(n);
  const buttonSize = max > 5 ? "h-9 w-9 sm:h-10 sm:w-10" : "h-12 w-12 sm:w-16";

  return (
    <div>
      {anchors && (
        <p className="mb-1.5 text-xs text-gray-500">
          {Object.entries(anchors)
            .map(([n, label]) => `${n} — ${label}`)
            .join(" · ")}
        </p>
      )}
      <div className={`grid gap-1 ${max > 5 ? "grid-cols-5 sm:flex" : "flex shrink-0"}`} role="radiogroup">
        {points.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            title={titleFor(n)}
            onClick={() => onChange(n)}
            className={`flex ${buttonSize} flex-col items-center justify-center rounded-md border text-sm font-semibold transition ${
              value === n
                ? "border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
                : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            {n}
            {labels && (
              <span className={`hidden text-[10px] font-normal sm:block ${value === n ? "text-indigo-100" : "text-gray-400"}`}>
                {labels[n - 1]}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
