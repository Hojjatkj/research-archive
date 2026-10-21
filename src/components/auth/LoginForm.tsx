"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/(auth)/actions";
import { EMPTY_FORM_STATE, hasErrors, normalizeEmail, validateLogin } from "@/lib/validation";
import { Field, FormAlert } from "./Field";
import { PasswordField } from "./PasswordField";
import { SubmitButton } from "./SubmitButton";
import { focusField, useFieldErrors } from "./useFieldErrors";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, EMPTY_FORM_STATE);
  const { formRef, errors, clear, setClientErrors } = useFieldErrors(state);

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={(event) => {
        const data = new FormData(event.currentTarget);
        const found = validateLogin({
          email: normalizeEmail(data.get("email")),
          password: String(data.get("password") ?? ""),
        });
        if (hasErrors(found)) {
          event.preventDefault();
          setClientErrors(found);
          focusField(event.currentTarget, Object.keys(found)[0]);
          return;
        }
        setClientErrors({});
      }}
      className="space-y-5"
    >
      <input type="hidden" name="next" value={next} />

      {state.formError ? <FormAlert>{state.formError}</FormAlert> : null}

      <Field
        id="login-email"
        name="email"
        type="email"
        label="ایمیل"
        required
        dir="ltr"
        inputMode="email"
        autoComplete="email"
        placeholder="name@university.ac.ir"
        defaultValue={state.values.email ?? ""}
        error={errors.email}
        onChange={() => clear("email")}
      />

      <PasswordField
        id="login-password"
        name="password"
        label="رمز عبور"
        required
        autoComplete="current-password"
        error={errors.password}
        onChange={() => clear("password")}
      />

      <SubmitButton pending={pending} pendingLabel="در حال ورود…">
        ورود به میز کار
      </SubmitButton>
    </form>
  );
}
