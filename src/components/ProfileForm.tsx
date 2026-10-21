"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveProfileAction } from "@/app/dashboard/actions";
import { type FormState, hasErrors, readProfile, validateProfile } from "@/lib/validation";
import { Field, FormAlert } from "./auth/Field";
import { SubmitButton } from "./auth/SubmitButton";
import { focusField, useFieldErrors } from "./auth/useFieldErrors";

export function ProfileForm({
  initial,
  email,
  userId,
}: {
  initial: Record<string, string>;
  email: string;
  userId: number;
}) {
  const initialState: FormState = { errors: {}, values: initial };
  const [state, formAction, pending] = useActionState(saveProfileAction, initialState);
  const { formRef, errors, clear, setClientErrors } = useFieldErrors(state);
  const v = state.values;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const found = validateProfile(readProfile(new FormData(event.currentTarget)));
        if (hasErrors(found)) {
          event.preventDefault();
          setClientErrors(found);
          focusField(event.currentTarget, Object.keys(found)[0]);
          return;
        }
        setClientErrors({});
      }}
      className="border border-ink/15 bg-paper-2 shadow-[0_18px_50px_rgba(22,35,63,0.08)]"
    >
      <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-8">
        {state.ok && state.message ? (
          <FormAlert tone="success">
            {state.message}{" "}
            <Link href={`/students/${userId}`} className="font-bold underline underline-offset-4">
              مشاهدهٔ صفحهٔ عمومی
            </Link>
          </FormAlert>
        ) : null}
        {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field id="pf-name" name="fullName" label="نام و نام خانوادگی" required autoComplete="name" defaultValue={v.fullName} error={errors.fullName} onChange={() => clear("fullName")} maxLength={80} />
          </div>
          <Field id="pf-number" name="studentNumber" label="شماره دانشجویی" required dir="ltr" inputMode="numeric" defaultValue={v.studentNumber} error={errors.studentNumber} onChange={() => clear("studentNumber")} maxLength={20} />
          <Field id="pf-university" name="university" label="نام دانشگاه" required defaultValue={v.university} error={errors.university} onChange={() => clear("university")} maxLength={100} />
          <Field id="pf-class" name="className" label="کلاس / درس" required defaultValue={v.className} error={errors.className} onChange={() => clear("className")} maxLength={100} />
          <Field id="pf-professor" name="professorName" label="نام استاد" required defaultValue={v.professorName} error={errors.professorName} onChange={() => clear("professorName")} maxLength={80} />
          <Field id="pf-time" name="classTime" label="زمان کلاس" optional placeholder="مثلاً: شنبه‌ها ۱۰ تا ۱۲" defaultValue={v.classTime} error={errors.classTime} onChange={() => clear("classTime")} maxLength={60} />
          <Field id="pf-email" name="accountEmail" label="ایمیل ورود" dir="ltr" defaultValue={email} readOnly hint="ایمیل خصوصی است و نمایش داده نمی‌شود." />
          <div className="sm:col-span-2">
            <Field id="pf-bio" name="bio" label="معرفی کوتاه" optional multiline rows={4} defaultValue={v.bio} error={errors.bio} onChange={() => clear("bio")} maxLength={400} hint="یک یا دو جمله دربارهٔ زمینهٔ پژوهشی یا هدف این بایگانی." />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-rule bg-paper px-5 py-5 sm:flex-row sm:items-center sm:px-8">
        <div className="sm:w-60">
          <SubmitButton pending={pending} pendingLabel="در حال ذخیره…">
            ذخیرهٔ اطلاعات
          </SubmitButton>
        </div>
        <p className="text-[12.5px] text-ink-soft">تغییرات بلافاصله روی صفحهٔ عمومی شما اعمال می‌شود.</p>
      </div>
    </form>
  );
}
