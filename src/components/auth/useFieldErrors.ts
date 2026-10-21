"use client";

import { useEffect, useRef, useState } from "react";
import type { FieldErrors, FormState } from "@/lib/validation";

export function focusField(form: HTMLFormElement, name: string | undefined): void {
  if (!name) return;
  const element = form.elements.namedItem(name);
  if (element instanceof HTMLElement) element.focus();
}

/**
 * Merges server errors (from the last submission) with client errors (from
 * instant validation). Typing in a field hides its stale server error, and
 * after every server response focus jumps to the first problem.
 */
export function useFieldErrors(state: FormState) {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [dismissed, setDismissed] = useState<{ state: FormState; keys: string[] }>({
    state,
    keys: [],
  });
  const dismissedKeys = dismissed.state === state ? dismissed.keys : [];

  const errors: FieldErrors = {};
  for (const [key, message] of Object.entries(state.errors)) {
    if (message && !dismissedKeys.includes(key)) errors[key] = message;
  }
  for (const [key, message] of Object.entries(clientErrors)) {
    if (message) errors[key] = message;
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const firstKey = Object.keys(state.errors).find((key) => state.errors[key]);
    if (firstKey) {
      focusField(form, firstKey);
    } else if (state.formError) {
      const target =
        form.querySelector<HTMLElement>('input[name="password"]') ??
        form.querySelector<HTMLElement>("input:not([type=hidden])");
      target?.focus();
    }
  }, [state]);

  function clear(name: string) {
    setClientErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setDismissed((prev) => ({
      state,
      keys: prev.state === state ? [...prev.keys, name] : [name],
    }));
  }

  return { formRef, errors, clear, setClientErrors };
}
