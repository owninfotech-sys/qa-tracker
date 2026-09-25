import { ensureDefaultAccounts } from "@/lib/default-accounts";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  try {
    await ensureDefaultAccounts();
  } catch (cause) {
    console.error("Could not ensure default MySQL accounts", cause);
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <LoginForm error={error} />
    </div>
  );
}
