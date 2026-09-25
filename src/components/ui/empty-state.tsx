export function EmptyState({
  title,
  body,
  children,
  compact,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded-[3px] border border-dashed border-line bg-card text-center ${
        compact ? "px-5 py-8" : "px-6 py-14"
      }`}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{body}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
