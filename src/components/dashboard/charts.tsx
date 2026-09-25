import Link from "next/link";
import type { DashboardBar, DashboardPoint, DashboardSlice } from "@/lib/dashboard";

function ChartCard({
  title,
  hint,
  action,
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#172033]">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-[#64748B]">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StackedBars({
  title,
  hint,
  rows,
  action,
}: {
  title: string;
  hint?: string;
  rows: DashboardBar[];
  action?: React.ReactNode;
}) {
  const max = Math.max(1, ...rows.map((row) => row.done + row.open));
  return (
    <ChartCard title={title} hint={hint} action={action}>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#94A3B8]">No work yet</p>
      ) : (
        <div className="space-y-3.5">
          {rows.map((row) => {
            const total = row.done + row.open;
            const bar = (
              <>
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate font-medium text-[#172033]">{row.label}</span>
                  <span className="shrink-0 text-[#64748B]">
                    {row.done} done · {row.open} open{row.late ? ` · ${row.late} late` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-[#EEF2FF]">
                    <span
                      className="h-full bg-[#22C55E]"
                      style={{ width: `${(Math.max(row.done - row.late, 0) / max) * 100}%` }}
                    />
                    <span className="h-full bg-[#F97316]" style={{ width: `${(row.late / max) * 100}%` }} />
                    <span className="h-full bg-[#2563EB]" style={{ width: `${(row.open / max) * 100}%` }} />
                  </div>
                  <span className="w-5 text-right text-xs font-semibold text-[#172033]">{total}</span>
                </div>
              </>
            );
            return row.href ? (
              <Link key={row.label} href={row.href} className="block rounded-md hover:bg-[#F8FAFC]">
                {bar}
              </Link>
            ) : (
              <div key={row.label}>{bar}</div>
            );
          })}
          <div className="flex gap-4 pt-1 text-[11px] text-[#64748B]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Done on time
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#F97316]" /> Late
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#2563EB]" /> Open
            </span>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

export function DonutChart({
  title,
  hint,
  slices,
  action,
}: {
  title: string;
  hint?: string;
  slices: DashboardSlice[];
  action?: React.ReactNode;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <ChartCard title={title} hint={hint} action={action}>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-[#94A3B8]">No data yet</p>
      ) : (
        <div className="flex items-center gap-5">
          <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="18" />
            {slices.map((slice) => {
              const length = (slice.value / total) * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  transform="rotate(-90 70 70)"
                >
                  <title>
                    {slice.label}: {slice.value}
                  </title>
                </circle>
              );
              offset += length;
              return circle;
            })}
            <text x="70" y="66" textAnchor="middle" fill="#172033" fontSize="18" fontWeight="700">
              {total}
            </text>
            <text x="70" y="84" textAnchor="middle" fill="#64748B" fontSize="10">
              items
            </text>
          </svg>
          <ul className="min-w-0 space-y-1.5 text-sm">
            {slices.map((slice) => (
              <li key={slice.label} className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 text-[#172033]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: slice.color }} />
                  <span className="truncate">{slice.label}</span>
                </span>
                <span className="font-semibold tabular-nums text-[#64748B]">
                  {slice.value} · {Math.round((slice.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </ChartCard>
  );
}

export function TrendChart({
  title,
  hint,
  points,
  action,
}: {
  title: string;
  hint?: string;
  points: DashboardPoint[];
  action?: React.ReactNode;
}) {
  const width = 560;
  const height = 180;
  const pad = { top: 12, right: 8, bottom: 28, left: 28 };
  const max = Math.max(1, ...points.flatMap((point) => [point.done, point.created]));
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const step = points.length > 1 ? innerW / (points.length - 1) : innerW;
  const toX = (index: number) => pad.left + index * step;
  const toY = (value: number) => pad.top + innerH - (value / max) * innerH;
  const doneLine = points.map((point, index) => `${toX(index)},${toY(point.done)}`).join(" ");
  const createdLine = points.map((point, index) => `${toX(index)},${toY(point.created)}`).join(" ");
  const area = `${toX(0)},${toY(0)} ${doneLine} ${toX(points.length - 1)},${toY(0)}`;

  return (
    <ChartCard title={title} hint={hint} action={action}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full">
        {[0, 0.5, 1].map((mark) => (
          <line
            key={mark}
            x1={pad.left}
            x2={width - pad.right}
            y1={toY(max * mark)}
            y2={toY(max * mark)}
            stroke="#E2E8F0"
          />
        ))}
        <polygon points={area} fill="#22C55E22" />
        <polyline points={createdLine} fill="none" stroke="#2563EB" strokeWidth="2.5" />
        <polyline points={doneLine} fill="none" stroke="#22C55E" strokeWidth="2.5" />
        {points.map((point, index) => (
          <text key={`${point.label}-${index}`} x={toX(index)} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748B">
            {index % 2 === 0 ? point.label : ""}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex gap-4 text-[11px] text-[#64748B]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[#2563EB]" /> Created
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[#22C55E]" /> Done
        </span>
      </div>
    </ChartCard>
  );
}
