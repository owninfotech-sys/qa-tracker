import { requireSession, roleCaps } from "@/lib/auth";
import { AppChrome } from "@/components/layout/app-chrome";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSession();
  const access = await roleCaps(user.role);

  return (
    <AppChrome role={user.role} access={access}>
      {children}
    </AppChrome>
  );
}
