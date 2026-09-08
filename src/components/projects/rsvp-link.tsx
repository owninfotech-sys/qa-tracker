import { ExternalLink } from "lucide-react";
import { hrefLabel, toHref } from "@/lib/format";

export function RsvpLink({
  href,
  compact = false,
}: {
  href?: string | null;
  compact?: boolean;
}) {
  const url = toHref(href);
  if (!url) {
    return compact ? null : <p className="text-sm text-muted">No RSVP link yet</p>;
  }

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 rounded-full bg-purple-soft px-2.5 py-0.5 text-xs font-medium text-purple hover:underline"
      >
        RSVP
        <ExternalLink size={11} />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center justify-between gap-3 rounded-2xl border border-purple/20 bg-gradient-to-r from-purple-soft to-white px-4 py-3 shadow-[0_1px_2px_rgba(132,48,206,.08)] transition hover:border-purple/40 hover:shadow-[0_8px_20px_rgba(132,48,206,.10)]"
    >
      <span>
        <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-purple">
          RSVP link
        </span>
        <span className="mt-0.5 block text-sm font-medium text-ink group-hover:text-purple">
          {hrefLabel(href)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1 rounded-full bg-purple px-3 py-1 text-xs font-semibold text-white">
        Open
        <ExternalLink size={12} />
      </span>
    </a>
  );
}
