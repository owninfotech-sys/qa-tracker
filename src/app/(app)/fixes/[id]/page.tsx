import { notFound, redirect } from "next/navigation";
import { canUpdateFix, hasAccess, requireSession } from "@/lib/auth";
import { findActivityForEntities, findFixById, findUsers } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { FixBadge, PriorityBadge } from "@/components/ui/status-badge";
import { assignFixAction, updateFixAction, wontFixAction } from "@/app/actions/fixes";
import { formatDateTime } from "@/lib/format";
import { BackLink } from "@/components/ui/back-link";
import { FormPendingLoader } from "@/components/ui/app-loader";

export default async function FixDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;

  const fix = await findFixById(id);
  if (!fix || !fix.runItem) notFound();

  const canSee =
    (await hasAccess(user.role, "viewAll")) ||
    (await canUpdateFix(user.role, fix.assigneeId, user.id)) ||
    fix.runItem.assigneeId === user.id;
  if (!canSee) redirect("/");

  const activities = await findActivityForEntities([fix.id, fix.runItemId]);

  const fixers = await findUsers({ active: true, role: "FIXER", orderBy: "name" });

  const manage = await hasAccess(user.role, "viewAll");
  const canUpdate = await canUpdateFix(user.role, fix.assigneeId, user.id);

  return (
    <>
      <Topbar user={user} title={fix.fixKey} />
      <main className="flex-1 p-6">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <section className="space-y-5 rounded-xl border border-line bg-card p-6">
            <div>
              <BackLink href={`/runs/${fix.runItem.run.id}`} label={fix.runItem.run.name} />
              <p className="mt-2 text-xs uppercase tracking-wide text-muted">
                {fix.runItem.case.project.name} · {fix.runItem.run.name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-normal tracking-tight">
                  {fix.fixKey} · {fix.title}
                </h1>
                <FixBadge status={fix.status} />
                <PriorityBadge priority={fix.runItem.case.priority} />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-medium">Found by</h2>
              <p className="mt-1 text-sm text-muted">
                {fix.runItem.assignee?.name ?? "Unknown tester"} · {fix.severity}
              </p>
            </div>

            <div>
              <h2 className="text-sm font-medium">How to reproduce</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
                {fix.steps || fix.runItem.comment || "No steps captured."}
              </p>
            </div>

            {fix.fixerNotes ? (
              <div className="rounded-lg bg-[#F8FAFC] p-4">
                <h2 className="text-sm font-medium">Fixer notes</h2>
                <p className="mt-1 text-sm text-muted">{fix.fixerNotes}</p>
              </div>
            ) : null}

            <div className="rounded-lg bg-[#F8FAFC] p-4">
              <h2 className="text-sm font-medium">Original testing point</h2>
              <p className="mt-1 text-sm font-medium text-ink">
                {fix.runItem.case.caseKey} · {fix.runItem.case.title}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{fix.runItem.case.steps}</p>
              <p className="mt-2 text-sm text-muted">
                Expected: {fix.runItem.case.expected}
              </p>
              <p className="mt-2 text-xs text-muted">Fixers cannot change this point. Update status and feedback only.</p>
            </div>
          </section>

          <section className="space-y-5">
            {error ? (
              <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                {decodeURIComponent(error)}
              </p>
            ) : null}

            {manage ? (
              <form action={assignFixAction} className="rounded-xl border border-line bg-card p-5">
                <FormPendingLoader />
                <input type="hidden" name="fixId" value={fix.id} />
                <h2 className="text-sm font-medium">Assign fixer</h2>
                <select name="assigneeId" defaultValue={fix.assigneeId ?? ""} className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm">
                  <option value="">Unassigned</option>
                  {fixers.map((fixer) => (
                    <option key={fixer.id} value={fixer.id}>
                      {fixer.name}
                    </option>
                  ))}
                </select>
                <button className="mt-3 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-hover">
                  Save assignee
                </button>
              </form>
            ) : null}

            {canUpdate && !["closed", "wont_fix"].includes(fix.status) ? (
              <form action={updateFixAction} className="rounded-xl border border-line bg-card p-5">
                <FormPendingLoader />
                <input type="hidden" name="fixId" value={fix.id} />
                <h2 className="text-sm font-medium">Update work</h2>
                <textarea
                  name="fixerNotes"
                  rows={4}
                  defaultValue={fix.fixerNotes ?? ""}
                  className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm"
                  placeholder="What did you change?"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button name="status" value="in_progress" className="rounded-lg border border-line py-2 text-sm font-medium hover:bg-[#F1F5F9]">
                    In progress
                  </button>
                  <button name="status" value="fixed" className="rounded-lg bg-blue py-2 text-sm font-medium text-white hover:bg-blue-hover">
                    Mark fixed
                  </button>
                </div>
              </form>
            ) : null}

            {manage && !["closed", "wont_fix"].includes(fix.status) ? (
              <form action={wontFixAction} className="rounded-xl border border-line bg-card p-5">
                <FormPendingLoader />
                <input type="hidden" name="fixId" value={fix.id} />
                <h2 className="text-sm font-medium">Won&apos;t fix</h2>
                <input name="reason" required className="mt-3 w-full rounded-lg border border-line px-3 py-2.5 text-sm" placeholder="Reason" />
                <button className="mt-3 text-sm font-medium text-danger">Close as won&apos;t fix</button>
              </form>
            ) : null}

            <div className="rounded-xl border border-line bg-card p-5">
              <h2 className="text-sm font-medium">History</h2>
              <div className="mt-3 space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id}>
                    <p className="text-sm text-ink">{activity.message}</p>
                    <p className="text-xs text-muted">
                      {activity.user.name} · {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                ))}
                {activities.length === 0 ? (
                  <p className="text-sm text-muted">No history yet.</p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
