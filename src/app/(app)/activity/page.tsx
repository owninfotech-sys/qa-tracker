import { Suspense } from "react";
import { redirect } from "next/navigation";
import { hasAccess, homeForRole, requireSession } from "@/lib/auth";
import { findWorkActivity } from "@/lib/data";
import { Topbar } from "@/components/layout/topbar";
import { BackLink } from "@/components/ui/back-link";
import { ActivityBrowser } from "@/components/dashboard/activity-browser";
import { PageLoader } from "@/components/ui/app-loader";

export default async function ActivityPage() {
  const user = await requireSession();
  if (!(await hasAccess(user.role, "dashboard"))) redirect(await homeForRole(user.role));
  const viewAll = await hasAccess(user.role, "viewAll");
  const rows = await findWorkActivity(viewAll ? undefined : { userId: user.id });

  return (
    <>
      <Topbar user={user} title="All activity" />
      <main className="flex-1 bg-[#F8FAFC] p-4 sm:p-6 lg:p-8">
        <BackLink href="/" label="Dashboard" />
        <Suspense fallback={<PageLoader label="Loading activity" />}>
          <ActivityBrowser rows={rows} />
        </Suspense>
      </main>
    </>
  );
}
