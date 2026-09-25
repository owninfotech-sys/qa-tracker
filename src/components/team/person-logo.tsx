"use client";

import { useRef, useTransition } from "react";
import { Camera, X } from "lucide-react";
import { removeUserLogoAction, uploadUserLogoAction } from "@/app/actions/users";
import { toast } from "@/components/ui/toast";
import { initials } from "@/lib/format";

export function PersonLogo({
  userId,
  name,
  logo,
  canEdit = true,
}: {
  userId: string;
  name: string;
  logo?: string | null;
  canEdit?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  function onFile(file?: File) {
    if (!file) return;
    const data = new FormData();
    data.set("id", userId);
    data.set("logo", file);
    start(async () => {
      const result = await uploadUserLogoAction(data);
      if (!result.ok) {
        toast(result.error, "error");
        return;
      }
      toast("Logo saved");
    });
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={pending || !canEdit}
        onClick={() => {
          if (!canEdit) return;
          input.current?.click();
        }}
        title={canEdit ? "Add logo" : name}
        className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#EFF6FF] text-xs font-semibold text-[#1D4ED8] disabled:opacity-60"
      >
        {logo ? (
          <img src={logo} alt="" className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
        <span className={`absolute inset-0 flex items-center justify-center bg-[#172033]/55 opacity-0 transition ${canEdit ? "group-hover:opacity-100" : ""}`}>
          {canEdit ? <Camera size={14} className="text-white" /> : null}
        </span>
      </button>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {logo && canEdit ? (
        <button
          type="button"
          title="Remove logo"
          disabled={pending}
          onClick={() => {
            const data = new FormData();
            data.set("id", userId);
            start(async () => {
              const result = await removeUserLogoAction(data);
              if (!result.ok) {
                toast(result.error, "error");
                return;
              }
              toast("Logo removed");
            });
          }}
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-[#DC2626] text-white hover:bg-[#B91C1C]"
        >
          <X size={10} />
        </button>
      ) : null}
    </div>
  );
}
