import { PageLoader } from "@/components/ui/app-loader";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
      <PageLoader />
    </div>
  );
}
