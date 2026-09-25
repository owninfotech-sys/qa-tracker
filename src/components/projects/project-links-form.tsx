import { updateProjectLinksAction } from "@/app/actions/projects";
import { FormPendingLoader } from "@/components/ui/app-loader";

export function ProjectLinksForm({
  id,
  url,
  rsvpUrl,
}: {
  id: string;
  url?: string | null;
  rsvpUrl?: string | null;
}) {
  return (
    <form action={updateProjectLinksAction} className="space-y-3">
      <FormPendingLoader />
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">Site URL</span>
        <input
          name="url"
          defaultValue={url ?? ""}
          placeholder="https://example.com"
          className="w-full rounded-xl border border-line bg-[#F8FAFC] px-3 py-2.5 text-sm transition focus:bg-white"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-muted">RSVP link</span>
        <input
          name="rsvpUrl"
          defaultValue={rsvpUrl ?? ""}
          placeholder="https://example.com/rsvp"
          className="w-full rounded-xl border border-line bg-[#F8FAFC] px-3 py-2.5 text-sm transition focus:bg-white"
        />
      </label>
      <button className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-[#F1F5F9]">
        Save links
      </button>
    </form>
  );
}
