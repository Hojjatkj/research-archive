"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  deleteAccountAction,
  deleteOtherAccountsAction,
  type AccountFormState,
} from "@/app/dashboard/actions";
import { ErrorText, fieldClass } from "./auth/Field";
import { SubmitButton } from "./auth/SubmitButton";

export type AccountDTO = {
  id: number;
  email: string;
  fullName: string;
  studentNumber: string;
  university: string;
  className: string;
  createdAt: string;
  items: number;
  published: number;
  isAdmin: boolean;
  isSelf: boolean;
};

const EMPTY: AccountFormState = {};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric" }).format(
    new Date(iso),
  );
}

/** Per-account delete: a native <details> disclosure, so it also works before JS loads. */
function DeleteAccountForm({ account }: { account: AccountDTO }) {
  const [state, formAction, pending] = useActionState(deleteAccountAction, EMPTY);
  const errorId = `delete-${account.id}-error`;

  return (
    <details className="mt-3" open={state.error ? true : undefined}>
      <summary className="inline-block cursor-pointer list-none border border-transparent px-2.5 py-1.5 text-[12.5px] font-bold text-accent transition-colors hover:border-accent [&::-webkit-details-marker]:hidden">
        حذف این حساب…
      </summary>
      <form
        action={formAction}
        aria-describedby={state.error ? errorId : undefined}
        className="mt-2 border border-accent/40 bg-accent/5 px-4 py-4"
      >
        <input type="hidden" name="userId" value={account.id} />
        <p className="text-[13px] leading-7 text-accent-2">
          حساب «{account.fullName}» برای همیشه حذف می‌شود
          {account.items > 0 ? (
            <>
              {" "}و <strong>{account.items} مطلب</strong> آن هم پاک می‌شود
            </>
          ) : null}
          . این کار برگشت‌پذیر نیست.
        </p>
        {state.error ? <ErrorText id={errorId}>{state.error}</ErrorText> : null}
        <div className="mt-3 sm:w-64">
          <SubmitButton pending={pending} pendingLabel="در حال حذف…" tone="accent">
            بله، این حساب حذف شود
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}

function DeleteOthersForm({ count, items }: { count: number; items: number }) {
  const [state, formAction, pending] = useActionState(deleteOtherAccountsAction, EMPTY);

  return (
    <section aria-labelledby="delete-others-title" className="border border-accent/40 bg-paper-2">
      <h2
        id="delete-others-title"
        className="border-b border-accent/30 bg-accent/10 px-5 py-3 text-[15px] font-black text-accent-2"
      >
        حذف همهٔ حساب‌های دیگر
      </h2>
      <form action={formAction} noValidate className="space-y-4 px-5 py-5">
        <p className="text-[13px] leading-7 text-ink-2">
          <strong>{count} حساب</strong>
          {items > 0 ? (
            <>
              {" "}و <strong>{items} مطلب</strong> آن‌ها
            </>
          ) : null}{" "}
          برای همیشه حذف می‌شوند. حساب خودتان دست نمی‌خورد.
        </p>
        <div>
          <label htmlFor="confirm-all" className="mb-1.5 block text-[13px] font-bold text-ink-2">
            برای تأیید، کلمهٔ «حذف» را بنویسید
          </label>
          <input
            id="confirm-all"
            name="confirm"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "confirm-all-error" : undefined}
            className={fieldClass(state.error)}
          />
          {state.error ? <ErrorText id="confirm-all-error">{state.error}</ErrorText> : null}
        </div>
        <SubmitButton pending={pending} pendingLabel="در حال حذف…" tone="accent">
          حذف همهٔ حساب‌های دیگر
        </SubmitButton>
      </form>
    </section>
  );
}

export function AccountsManager({ accounts }: { accounts: AccountDTO[] }) {
  const others = accounts.filter((account) => !account.isSelf);
  const otherItems = others.reduce((sum, account) => sum + account.items, 0);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]">
      <section aria-labelledby="accounts-title">
        <div className="flex items-baseline justify-between border-b-2 border-ink pb-3">
          <h2 id="accounts-title" className="text-[19px] font-black text-ink">
            همهٔ حساب‌ها
          </h2>
          <p className="num text-[12px] text-ink-soft">{String(accounts.length).padStart(2, "0")} حساب</p>
        </div>

        <ul>
          {accounts.map((account) => (
            <li key={account.id} className="border-b border-rule py-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[16px] font-black leading-8 text-ink">{account.fullName}</p>
                {account.isAdmin ? (
                  <span className="border border-moss/40 bg-moss/10 px-2 py-0.5 text-[11px] font-bold text-moss">
                    مدیر سایت
                  </span>
                ) : null}
                {account.isSelf ? (
                  <span className="border border-ink/25 px-2 py-0.5 text-[11px] font-bold text-ink-2">شما</span>
                ) : null}
              </div>

              <p className="mt-0.5 text-[13px] text-ink-2">
                <bdi dir="ltr" className="num">
                  {account.email}
                </bdi>
              </p>

              <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-ink-soft">
                {account.studentNumber ? (
                  <span>
                    شمارهٔ دانشجویی:{" "}
                    <bdi dir="ltr" className="num">
                      {account.studentNumber}
                    </bdi>
                  </span>
                ) : null}
                {account.university ? <span>{account.university}</span> : null}
                {account.className ? <span>{account.className}</span> : null}
              </p>

              <p className="mt-1 text-[12px] text-ink-soft">
                عضویت: {formatDate(account.createdAt)} · {account.items} مطلب ({account.published} منتشرشده) ·{" "}
                <Link href={`/students/${account.id}`} className="font-bold text-ink-2 hover:text-accent">
                  صفحهٔ عمومی
                </Link>
              </p>

              {account.isSelf ? null : <DeleteAccountForm account={account} />}
            </li>
          ))}
        </ul>
      </section>

      <aside className="space-y-5 lg:sticky lg:top-8">
        {others.length > 0 ? (
          <DeleteOthersForm count={others.length} items={otherItems} />
        ) : (
          <p className="border border-dashed border-rule px-5 py-6 text-[13px] leading-7 text-ink-soft">
            حساب دیگری وجود ندارد؛ فقط حساب شما باقی مانده است.
          </p>
        )}
        <div className="border border-rule px-5 py-5 text-[12.5px] leading-7 text-ink-soft">
          <strong className="text-ink-2">نکته:</strong> اگر فقط می‌خواهید مطلبی از دید عموم خارج شود، از{" "}
          <Link href="/dashboard/moderation" className="font-bold text-ink underline underline-offset-4">
            مدیریت مطالب
          </Link>{" "}
          استفاده کنید؛ آن کار هیچ چیزی را حذف نمی‌کند.
        </div>
      </aside>
    </div>
  );
}
