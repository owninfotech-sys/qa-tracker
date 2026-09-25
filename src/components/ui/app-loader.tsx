"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";

export function LoaderMark({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className="qa-loader pointer-events-none"
      aria-hidden
    >
      <circle cx="24" cy="24" r="18" stroke="#EDE9FE" strokeWidth="6" />
      <circle
        cx="24"
        cy="24"
        r="18"
        stroke="#5B21B6"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="28 85"
      />
    </svg>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-1 flex-col items-center justify-center bg-[#F8FAFC]"
      role="status"
      aria-label={label}
    >
      <LoaderMark />
    </div>
  );
}

let jobs = 0;
let navigating = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function startProcess() {
  jobs += 1;
  emit();
}

export function stopProcess() {
  jobs = Math.max(0, jobs - 1);
  emit();
}

function setNavigating(next: boolean) {
  if (navigating === next) return;
  navigating = next;
  emit();
}

export function useProcess(pending: boolean) {
  useEffect(() => {
    if (!pending) return;
    startProcess();
    return () => stopProcess();
  }, [pending]);
}

export function FormPendingLoader() {
  const { pending } = useFormStatus();
  useProcess(pending);
  return null;
}

function isServerAction(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  return headers.has("Next-Action") || headers.has("next-action");
}

export function ProcessHost() {
  const pathname = usePathname();
  const [, setTick] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onChange = () => setTick((value) => value + 1);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const original = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const action = isServerAction(input, init);
      if (action) startProcess();
      try {
        return await original(input as RequestInfo, init);
      } finally {
        if (action) stopProcess();
      }
    };
    return () => {
      window.fetch = original;
    };
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      if (link.hasAttribute("download")) return;
      const target = link.getAttribute("target");
      if (target && target !== "_self") return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;
      setNavigating(true);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const busy = navigating || jobs > 0;

  useEffect(() => {
    if (!busy) {
      setVisible(false);
      return;
    }
    const timer = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(timer);
  }, [busy]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#F8FAFC]/72"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <LoaderMark size={52} />
    </div>
  );
}
