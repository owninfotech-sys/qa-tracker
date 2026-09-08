import { requireSession } from "@/lib/auth";
import { AppChrome } from "@/components/layout/app-chrome";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();

  return <AppChrome role={user.role}>{children}</AppChrome>;
}
