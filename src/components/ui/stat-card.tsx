export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "blue" | "green" | "red" | "orange";
}) {
  const values = {
    default: "text-[#172b4d]",
    blue: "text-[#0c66e4]",
    green: "text-[#22a06b]",
    red: "text-[#c9372c]",
    orange: "text-[#e56910]",
  };

  return (
    <div className="rounded-xl border border-[#dcdfe4] bg-white p-4 shadow-[0_1px_1px_#091e420a]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#626f86]">
        {label}
      </p>
      <p className={`mt-2 text-[28px] font-semibold leading-none tracking-tight ${values[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[#626f86]">{hint}</p> : null}
    </div>
  );
}
