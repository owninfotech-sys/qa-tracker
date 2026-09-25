import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-[3px] border border-[#E2E8F0] bg-white px-2.5 py-1.5 text-sm font-medium text-[#172033] hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:text-[#1D4ED8]"
    >
      <ArrowLeft size={14} />
      Back to {label}
    </Link>
  );
}
