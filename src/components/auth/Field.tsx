import type { HTMLAttributes, ReactNode } from "react";

type InputMode = HTMLAttributes<HTMLInputElement>["inputMode"];

const BASE =
  "block w-full border bg-white px-3.5 py-2.5 text-[15px] leading-7 text-ink placeholder:text-ink-soft/50 transition-colors focus:outline-none focus:ring-2 read-only:bg-paper-3/40 read-only:text-ink-soft";
const NORMAL = "border-rule hover:border-ink/40 focus:border-ink focus:ring-ink/10";
const INVALID = "border-accent focus:border-accent focus:ring-accent/15";

export function fieldClass(error?: string, extra = ""): string {
  return `${BASE} ${error ? INVALID : NORMAL} ${extra}`;
}

export function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[12.5px] leading-6 text-accent-2">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="mt-[3px] shrink-0">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 7.5v5.5M12 16.2v.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function FormAlert({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
}) {
  const styles = {
    error: "border-accent bg-accent/10 text-accent-2",
    success: "border-moss bg-moss/10 text-moss",
    info: "border-ink/40 bg-paper-3/60 text-ink-2",
  }[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`border-s-4 px-4 py-3 text-[13.5px] leading-7 ${styles}`}
    >
      {children}
    </div>
  );
}

export type FieldProps = {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  defaultValue?: string;
  placeholder?: string;
  dir?: "rtl" | "ltr" | "auto";
  inputMode?: InputMode;
  autoComplete?: string;
  maxLength?: number;
  multiline?: boolean;
  rows?: number;
  readOnly?: boolean;
  onChange?: () => void;
};

export function Field({
  id,
  name,
  label,
  type = "text",
  required,
  optional,
  hint,
  error,
  defaultValue,
  placeholder,
  dir,
  inputMode,
  autoComplete,
  maxLength,
  multiline,
  rows = 4,
  readOnly,
  onChange,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = !error && hint ? `${id}-hint` : undefined;
  const describedBy = errorId ?? hintId;
  const align = dir === "ltr" ? "text-left" : "";

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
        {optional ? <span className="text-[11px] text-ink-soft">اختیاری</span> : null}
      </div>

      {multiline ? (
        <textarea
          id={id}
          name={name}
          rows={rows}
          dir={dir}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          onChange={onChange ? () => onChange() : undefined}
          className={fieldClass(error, `resize-y ${align}`)}
        />
      ) : (
        <input
          id={id}
          name={name}
          type={type}
          dir={dir}
          inputMode={inputMode}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={maxLength}
          readOnly={readOnly}
          spellCheck={dir === "ltr" ? false : undefined}
          autoCapitalize={dir === "ltr" ? "none" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          onChange={onChange ? () => onChange() : undefined}
          className={fieldClass(error, align)}
        />
      )}

      {error ? (
        <ErrorText id={errorId}>{error}</ErrorText>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-[12px] leading-6 text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
