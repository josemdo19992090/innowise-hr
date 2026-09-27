"use client";

// Dumbbell chart: CV score vs. interview score, one row per candidate who's
// been through both. This is the only place the two numbers sit side by
// side — it turns "the CV score was 84" and "the interview score was 3.2/5"
// (two disconnected numbers on two different pages) into one readable
// question: does the initial screen actually predict how people do face to
// face?
//
// Built in plain HTML/CSS with percentage-based positioning rather than an
// SVG viewBox: an SVG scaled down to a phone-width container shrinks its
// text right along with its geometry (measured ~5.8px rendered at 375px
// wide for a 10px label) — illegible. Marks (dots, connector lines,
// gridlines) scale with the container as geometry should; every label stays
// real CSS text at a fixed size, so it never shrinks below readable.
//
// Two-color categorical palette, validated with the dataviz skill's
// validator (light mode, worst adjacent normal-vision ΔE 33.6, CVD ΔE 24.7 —
// well clear of the floors). The app has no dark theme, so these are used
// directly rather than through light/dark CSS variables.
const COLOR_CV = "#2a78d6"; // blue — CV score
const COLOR_INTERVIEW = "#eb6834"; // orange — interview score
const TEXT_MUTED = "#898781";
const GRID = "#e1e0d9";

const ROW_H = 40;
const TICKS = [0, 25, 50, 75, 100];

export default function ScoreComparisonChart({ t, data }) {
  if (!data || data.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm shadow-gray-200/60 sm:p-6">
      <h2 className="text-lg font-semibold">{t.statsComparisonTitle}</h2>
      <p className="mt-1 text-sm text-gray-600">{t.statsComparisonHint}</p>

      {/* Legend — always present for 2+ series, per the dataviz skill. */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <LegendSwatch color={COLOR_CV} label={t.statsComparisonCv} />
        <LegendSwatch color={COLOR_INTERVIEW} label={t.statsComparisonInterview} />
      </div>

      <div className="mt-4 grid grid-cols-[minmax(100px,38%)_1fr] gap-x-2 sm:grid-cols-[130px_1fr] sm:gap-x-3">
        {/* Row name labels — plain HTML, real text, never scaled. Left-aligned:
            text-overflow:ellipsis only truncates reliably at the reading
            end of the text, so pairing it with text-align:right clips
            silently from the start with no "…" shown. */}
        <div>
          <div style={{ height: 20 }} />
          {data.map((d, i) => (
            <div
              key={i}
              className="flex items-center truncate text-xs text-gray-700"
              style={{ height: ROW_H }}
              title={d.name}
            >
              {d.name}
            </div>
          ))}
        </div>

        {/* Plot area: gridlines + ticks, then one row per candidate. */}
        <div className="relative" style={{ height: 20 + data.length * ROW_H }}>
          <div className="absolute inset-x-3 inset-y-0">
            {TICKS.map((tick) => (
              <div key={tick} className="absolute top-0 h-full" style={{ left: `${tick}%` }}>
                <span
                  className="absolute -top-0.5 -translate-x-1/2 text-[10px] text-gray-400"
                  style={tick === 0 ? { transform: "translateX(0)" } : tick === 100 ? { transform: "translateX(-100%)" } : undefined}
                >
                  {tick}
                </span>
                <div className="absolute top-5 bottom-0 w-px" style={{ backgroundColor: GRID }} />
              </div>
            ))}

            {data.map((d, i) => (
              <ComparisonRow key={i} d={d} top={20 + i * ROW_H + ROW_H / 2} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonRow({ d, top, t }) {
  const cvPct = clampPct(d.cvScore);
  const ivPct = clampPct(d.interviewScore * 20);
  const left = Math.min(cvPct, ivPct);
  const width = Math.abs(cvPct - ivPct);

  return (
    <div
      className="absolute inset-x-0"
      style={{ top }}
      title={`${d.name}: ${t.statsComparisonCv} ${d.cvScore}/100 · ${t.statsComparisonInterview} ${d.interviewScore.toFixed(1)}/5`}
    >
      {width > 0.5 && (
        <div
          className="absolute h-0.5 -translate-y-1/2 rounded-full"
          style={{ left: `${left}%`, width: `${width}%`, backgroundColor: TEXT_MUTED }}
        />
      )}
      <Dot pct={cvPct} color={COLOR_CV} label={String(d.cvScore)} labelAbove />
      <Dot pct={ivPct} color={COLOR_INTERVIEW} label={`${d.interviewScore.toFixed(1)}/5`} />
    </div>
  );
}

function Dot({ pct, color, label, labelAbove = false }) {
  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${pct}%` }}>
      <span
        className="block h-2.5 w-2.5 rounded-full ring-2 ring-white"
        style={{ backgroundColor: color, boxShadow: "0 0 0 1px rgba(11,11,11,0.08)" }}
      />
      <span
        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-gray-600 ${
          labelAbove ? "-top-4" : "top-3"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function LegendSwatch({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function clampPct(score) {
  return Math.min(100, Math.max(0, score));
}
