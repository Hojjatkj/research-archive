"use client";

import { useEffect, useRef, useState } from "react";
import { passwordStrength } from "@/lib/validation";
import { ErrorText, fieldClass } from "./Field";

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  required?: boolean;
  error?: string;
  hint?: string;
  showStrength?: boolean;
  onChange?: () => void;
};

const BAR_COLORS = ["bg-rule", "bg-accent", "bg-[#b7791f]", "bg-moss", "bg-moss"];

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 3.5l17 17" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-3.1 4.1M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 19 12 19c1.6 0 3-.4 4.2-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Password input with a show/hide toggle, a Caps Lock warning and an optional
 * strength meter. Uncontrolled, so the form resets it after a submission.
 */
export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  required,
  error,
  hint,
  showStrength = false,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const [capsLock, setCapsLock] = useState(false);
  const strength = passwordStrength(value);

  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => setValue("");
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const errorId = error ? `${id}-error` : undefined;
  const hintId = !error && hint ? `${id}-hint` : undefined;
  const strengthId = showStrength && value ? `${id}-strength` : undefined;
  const describedBy = [errorId ?? hintId, strengthId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[13px] font-bold text-ink-2">
          {label}
          {required ? (
            <span aria-hidden="true" className="ms-1 text-accent">
              *
            </span>
          ) : null}
        </label>
        {capsLock ? (
          <span className="text-[11.5px] font-bold text-accent-2" role="status">
            Caps Lock روشن است
          </span>
        ) : null}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          dir="ltr"
          autoComplete={autoComplete}
          spellCheck={false}
          autoCapitalize="none"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          onChange={(event) => {
            setValue(event.target.value);
            onChange?.();
          }}
          onKeyDown={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onKeyUp={(event) => setCapsLock(event.getModifierState("CapsLock"))}
          onBlur={() => setCapsLock(false)}
          className={fieldClass(error, "pr-12 text-left")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          aria-pressed={visible}
          aria-label={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          title={visible ? "پنهان کردن رمز عبور" : "نمایش رمز عبور"}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-soft transition-colors hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>

      {error ? (
        <ErrorText id={errorId}>{error}</ErrorText>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[12px] leading-6 text-ink-soft">
          {hint}
        </p>
      ) : null}

      {showStrength && value ? (
        <div id={strengthId} className="mt-2.5" aria-live="polite">
          <div className="flex gap-1" aria-hidden="true">
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={`h-1 flex-1 transition-colors ${
                  strength.score >= step ? BAR_COLORS[strength.score] : "bg-rule"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-soft">
            قدرت رمز: <span className="font-bold text-ink-2">{strength.label}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
