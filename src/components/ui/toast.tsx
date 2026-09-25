"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, X } from "lucide-react";

type ToastTone = "success" | "error";
type ToastItem = { id: number; message: string; tone: ToastTone };

let addToast: ((message: string, tone?: ToastTone) => void) | null = null;

export function toast(message: string, tone: ToastTone = "success") {
  addToast?.(message, tone);
}

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    addToast = (message, tone = "success") => {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 2800);
    };
    return () => {
      addToast = null;
    };
  }, []);

  if (!items.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto flex items-start gap-3 rounded-[3px] border border-[#E2E8F0] bg-white px-3.5 py-3 shadow-[0_8px_24px_rgba(23,32,51,.12)]"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              item.tone === "error" ? "bg-[#FEF2F2] text-[#DC2626]" : "bg-[#DCFCE7] text-[#16A34A]"
            }`}
          >
            {item.tone === "error" ? <CircleAlert size={13} /> : <Check size={13} />}
          </span>
          <p className="min-w-0 flex-1 text-sm font-medium text-[#172033]">{item.message}</p>
          <button
            type="button"
            className="rounded-[3px] p-0.5 text-[#64748B] hover:bg-[#F8FAFC]"
            onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
