/**
 * Shared form validation — used by client forms (instant feedback) and by
 * server actions (the source of truth). Keep this file free of server-only
 * imports so it can ship to the browser.
 */

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

/** Persian / Arabic-Indic digits → Latin, so «۴۰۱۲۳» and «40123» are the same. */
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

export type ProfileInput = {
  fullName: string;
  studentNumber: string;
  university: string;
  className: string;
  professorName: string;
  classTime: string;
  bio: string;
};

type Source = FormData | Record<string, unknown>;

function pick(source: Source, key: string): unknown {
  if (typeof FormData !== "undefined" && source instanceof FormData) return source.get(key);
  return (source as Record<string, unknown>)[key];
}

export function readProfile(source: Source): ProfileInput {
  const bio = pick(source, "bio");
  return {
    fullName: oneLine(pick(source, "fullName")),
    studentNumber: toLatinDigits(oneLine(pick(source, "studentNumber"))).replace(/\s/g, ""),
    university: oneLine(pick(source, "university")),
    className: oneLine(pick(source, "className")),
    professorName: oneLine(pick(source, "professorName")),
    classTime: oneLine(pick(source, "classTime")),
    bio: typeof bio === "string" ? bio.trim() : "",
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateProfile(p: ProfileInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!p.fullName) errors.fullName = "نام و نام خانوادگی را وارد کنید.";
  else if (p.fullName.length < 3) errors.fullName = "نام باید دست‌کم ۳ نویسه باشد.";
  else if (p.fullName.length > 80) errors.fullName = "نام حداکثر ۸۰ نویسه است.";

  if (!p.studentNumber) errors.studentNumber = "شماره دانشجویی را وارد کنید.";
  else if (!/^[0-9A-Za-z-]{4,20}$/.test(p.studentNumber))
    errors.studentNumber = "شماره دانشجویی باید ۴ تا ۲۰ نویسه و فقط رقم یا حروف لاتین باشد.";

  if (!p.university) errors.university = "نام دانشگاه را وارد کنید.";
  else if (p.university.length > 100) errors.university = "نام دانشگاه حداکثر ۱۰۰ نویسه است.";

  if (!p.className) errors.className = "نام کلاس یا درس را وارد کنید.";
  else if (p.className.length > 100) errors.className = "نام کلاس حداکثر ۱۰۰ نویسه است.";

  if (!p.professorName) errors.professorName = "نام استاد را وارد کنید.";
  else if (p.professorName.length > 80) errors.professorName = "نام استاد حداکثر ۸۰ نویسه است.";

  if (p.classTime.length > 60) errors.classTime = "زمان کلاس حداکثر ۶۰ نویسه است.";
  if (p.bio.length > 400) errors.bio = "معرفی کوتاه حداکثر ۴۰۰ نویسه است.";

  return errors;
}

export function validateEmail(email: string): string | undefined {
  if (!email) return "ایمیل را وارد کنید.";
  if (email.length > 120 || !EMAIL_RE.test(email))
    return "قالب ایمیل درست نیست؛ مثلاً name@university.ac.ir";
  return undefined;
}

export function validatePassword(password: string, mode: "login" | "signup"): string | undefined {
  if (!password) return "رمز عبور را وارد کنید.";
  if (mode === "signup") {
    if (password.length < 8) return "رمز عبور باید دست‌کم ۸ نویسه باشد.";
    if (password.length > 128) return "رمز عبور حداکثر ۱۲۸ نویسه است.";
  }
  return undefined;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  const password = validatePassword(input.password, "login");
  if (password) errors.password = password;
  return errors;
}

/** Key order follows the form: student details first, then the account fields. */
export function validateSignup(
  input: ProfileInput & { email: string; password: string },
): FieldErrors {
  const errors: FieldErrors = { ...validateProfile(input) };
  const email = validateEmail(input.email);
  if (email) errors.email = email;
  const password = validatePassword(input.password, "signup");
  if (password) errors.password = password;
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
