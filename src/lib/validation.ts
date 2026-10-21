/** Shared form validation used by the owner login on both client and server. */

export type FieldErrors = Partial<Record<string, string>>;

export type FormState = {
  ok?: boolean;
  formError?: string;
  message?: string;
  errors: FieldErrors;
  values: Record<string, string>;
};

export const EMPTY_FORM_STATE: FormState = { errors: {}, values: {} };

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/** Persian / Arabic-Indic digits → Latin. */
export function toLatinDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (digit) => {
    const fa = FA_DIGITS.indexOf(digit);
    return String(fa >= 0 ? fa : AR_DIGITS.indexOf(digit));
  });
}

function oneLine(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export function normalizeEmail(value: unknown): string {
  return toLatinDigits(oneLine(value)).replace(/\s/g, "").toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  if (!email) return "ایمیل را وارد کنید.";
  if (email.length > 120 || !EMAIL_RE.test(email)) {
    return "قالب ایمیل درست نیست؛ مثلاً name@example.com";
  }
  return undefined;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  if (!input.password) errors.password = "رمز عبور را وارد کنید.";
  else if (input.password.length > 256) errors.password = "رمز عبور نامعتبر است.";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function passwordStrength(password: string): { score: number; label: string } {
  if (!password) return { score: 0, label: "" };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Za-z\u0600-\u06FF]/.test(password) && /[0-9۰-۹]/.test(password)) score += 1;
  if (/[^A-Za-z0-9\u0600-\u06FF\s]/.test(password) || (/[a-z]/.test(password) && /[A-Z]/.test(password)))
    score += 1;
  if (password.length < 8) score = Math.min(score, 1);
  const labels = ["خیلی ضعیف", "ضعیف", "متوسط", "خوب", "قوی"];
  return { score, label: labels[score] };
}
