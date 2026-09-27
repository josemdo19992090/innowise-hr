// Shared 1–5 rating control — used by the interview checklist and by the
// manual CV-evaluation criteria, so both feel like the same mechanism.
export default function RatingScale({ value, onChange, labels }) {
  return (
    <div className="flex shrink-0 gap-1" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          title={labels[n - 1]}
          onClick={() => onChange(n)}
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-md border text-sm font-semibold transition sm:w-16 ${
            value === n
              ? "border-transparent bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20"
              : "border-gray-200 text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
          }`}
        >
          {n}
          <span className={`hidden text-[10px] font-normal sm:block ${value === n ? "text-indigo-100" : "text-gray-400"}`}>
            {labels[n - 1]}
          </span>
        </button>
      ))}
    </div>
  );
}
