import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { canExecuteItem, hasAccess, requireSession } from "@/lib/auth";
import { findRunItemById } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { PriorityBadge, ResultBadge } from "@/components/ui/status-badge";
import { executeItemAction, startItemAction } from "@/app/actions/execute";
import { BackLink } from "@/components/ui/back-link";

export default async function ExecutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;

  const item = await findRunItemById(id);
  if (!item) notFound();

  const canRun = await canExecuteItem(user.role, item.assigneeId, user.id);
  const linkedFix = item.fixTasks.find((fix) => fix.assigneeId === user.id);
  const canFix = Boolean(linkedFix) && (await hasAccess(user.role, "updateFix"));
  if (!canRun && !canFix) redirect("/");

  const steps = item.case.steps.split("\n").filter(Boolean);
  const locked = item.run.status === "closed" || !canRun;

  return (
    <>
      <Topbar user={user} title="Execute test" />
      <main className="flex-1 p-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <section className="rounded-xl border border-line bg-card p-6">
            <BackLink href={`/runs/${item.run.id}`} label={item.run.name} />
            <p className="mt-2 text-xs uppercase tracking-wide text-muted">
              <Link href={`/projects/${item.case.project.id}/testing`} className="text-blue hover:underline">
                {item.case.project.name} · Testing
              </Link>
            </p>
            <div className="mt-2 flex items-center gap-2">
              <h1 className="text-2xl font-normal tracking-tight">
                {item.case.caseKey} · {item.case.title}
              </h1>
              <PriorityBadge priority={item.case.priority} />
              <ResultBadge result={item.result} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {item.case.page?.name ?? item.case.project.name}
            </p>

            {item.case.preconditions ? (
              <div className="mt-6">
                <h2 className="text-sm font-medium">Preconditions</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.case.preconditions}</p>
              </div>
            ) : null}

            <div className="mt-6">
              <h2 className="text-sm font-medium">Steps</h2>
              <ol className="mt-3 space-y-2">
                {steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-soft text-xs font-medium text-blue-ink">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="mt-6 rounded-lg bg-blue-soft/60 p-4">
              <h2 className="text-sm font-medium text-blue-ink">Expected</h2>
              <p className="mt-1 text-sm">{item.case.expected}</p>
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-6">
            <h2 className="text-base font-medium">Result</h2>
            {error ? <p className="mt-2 text-sm text-danger">{decodeURIComponent(error)}</p> : null}
            {locked ? (
              <p className="mt-4 text-sm text-muted">
                {item.run.status === "closed"
                  ? "This run is closed. Results are locked."
                  : "This testing point is read-only. Update status and feedback on the fix task."}
              </p>
            ) : (
              <>
                {item.result === "pending" ? (
                  <form action={startItemAction} className="mt-4">
                    <input type="hidden" name="itemId" value={item.id} />
                    <button className="w-full rounded-lg border border-blue px-4 py-2.5 text-sm font-medium text-blue hover:bg-blue-soft">
                      Start testing
                    </button>
                  </form>
                ) : null}

                <form action={executeItemAction} className="mt-4 space-y-4">
                  <input type="hidden" name="itemId" value={item.id} />
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Comment / actual result</span>
                    <textarea
                      name="comment"
                      rows={4}
                      defaultValue={item.comment ?? ""}
                      className="w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                      placeholder="Required for fail, block, or skip"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium">Severity if fail</span>
                    <select name="severity" defaultValue="major" className="w-full rounded-lg border border-line px-3 py-2.5 text-sm">
                      <option value="critical">Critical</option>
                      <option value="major">Major</option>
                      <option value="minor">Minor</option>
                      <option value="trivial">Trivial</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button name="result" value="pass" className="rounded-lg bg-success px-3 py-2.5 text-sm font-medium text-white">
                      Pass
                    </button>
                    <button name="result" value="fail" className="rounded-lg bg-danger px-3 py-2.5 text-sm font-medium text-white">
                      Fail
                    </button>
                    <button name="result" value="blocked" className="rounded-lg bg-warning px-3 py-2.5 text-sm font-medium text-white">
                      Blocked
                    </button>
                    <button name="result" value="skipped" className="rounded-lg border border-line px-3 py-2.5 text-sm font-medium">
                      Skip
                    </button>
                  </div>
                </form>
              </>
            )}

            {item.fixTasks[0] ? (
              <p className="mt-5 text-sm text-muted">
                Linked fix: <span className="font-medium text-ink">{item.fixTasks[0].fixKey}</span>
              </p>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
