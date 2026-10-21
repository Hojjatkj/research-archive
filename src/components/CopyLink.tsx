"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientOrigin = () => window.location.origin;
const getServerOrigin = () => "";

/** Shows the absolute URL of a path and copies it with one click. */
export function CopyLink({ path, label = "کپی لینک" }: { path: string; label?: string }) {
  const origin = useSyncExternalStore(subscribe, getClientOrigin, getServerOrigin);
  const [copied, setCopied] = useState(false);
  const url = `${origin}${path}`;

  async function copy() {
    const absoluteUrl = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("لینک را کپی کنید:", absoluteUrl);
    }
  }

  return (
    <div className="flex items-stretch gap-2">
      <code dir="ltr" className="num min-w-0 flex-1 truncate border border-rule bg-white px-3 py-2 text-left text-[12.5px] leading-6 text-ink-2">
        {url}
      </code>
      <button
        type="button"
        onClick={() => void copy()}
        className={`shrink-0 border px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
          copied ? "border-moss bg-moss text-paper-2" : "border-ink text-ink hover:bg-ink hover:text-paper-2"
        }`}
      >
        {copied ? "کپی شد ✓" : label}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "لینک کپی شد" : ""}
      </span>
    </div>
  );
}
