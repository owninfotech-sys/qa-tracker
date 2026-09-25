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
    default: "text-[#172033]",
    blue: "text-[#2563EB]",
    green: "text-[#22a06b]",
    red: "text-[#DC2626]",
    orange: "text-[#D97706]",
  };

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_1px_#091e420a]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
        {label}
      </p>
      <p className={`mt-2 text-[28px] font-semibold leading-none tracking-tight ${values[tone]}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-[#64748B]">{hint}</p> : null}
    </div>
  );
}
