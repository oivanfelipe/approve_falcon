export default function StatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  /** Highlights the number in red — use for the one figure that needs attention */
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white border-2 border-black shadow-hard-sm">
      <span className="text-[11px] font-mono uppercase tracking-wider text-black/50">
        {label}
      </span>
      <span
        className={`text-3xl font-extrabold tabular-nums ${accent ? "text-[#e10600]" : "text-black"}`}
      >
        {value}
      </span>
    </div>
  );
}
