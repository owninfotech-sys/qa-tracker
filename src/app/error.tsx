"use client";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error.message || "";
  const dbDown =
    message.includes("Can't reach database") ||
    message.includes("PrismaClientInitializationError") ||
    message.includes("P1001");
  const missingTable =
    message.includes("does not exist in the current database") ||
    message.includes("P2021");
  const staleSession =
    message.includes("session") &&
    (message.includes("Foreign key constraint violated") || message.includes("P2003"));

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {dbDown
          ? "MySQL is not running"
          : missingTable
            ? "Database tables are missing"
            : staleSession
              ? "Please sign in again"
              : "Something went wrong"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {dbDown
          ? "QA Tracker cannot reach MySQL at 127.0.0.1:3306. Start MariaDB from the XAMPP control panel, or run npm run db:start, then try again."
          : missingTable
            ? "The app database is missing required tables. Stop and run npm run db:setup, then refresh this page."
            : staleSession
              ? "Your saved login does not match the current database. Sign out, sign in, then try again."
              : message || "Refresh this page and try the action again."}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 w-fit rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </main>
  );
}
