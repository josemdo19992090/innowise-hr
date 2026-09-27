export default function ScoreBadge({ score, large = false }) {
  const color =
    score >= 75
      ? "bg-green-50 text-green-800 ring-green-200"
      : score >= 50
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-red-50 text-red-800 ring-red-200";
  return (
    <span
      className={`inline-flex items-baseline rounded-md font-semibold tabular-nums ring-1 ring-inset ${color} ${
        large ? "px-3 py-1.5 text-3xl" : "px-2 py-0.5 text-sm"
      }`}
    >
      {score}
      <span className={`ml-0.5 font-normal opacity-60 ${large ? "text-base" : "text-xs"}`}>/100</span>
    </span>
  );
}
