"use client";

import Link from "next/link";
import { useEffect } from "react";
import { EmptySheet } from "@/components/Brand";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("page error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <EmptySheet className="h-16 w-16 text-ink/30" />
      <h1 className="mt-6 text-[clamp(1.7rem,4.5vw,2.4rem)] font-black leading-[1.5] text-ink">
        مشکلی در نمایش این صفحه پیش آمد
      </h1>
      <p className="mt-4 text-[15px] leading-9 text-ink-soft">
        یک بار دیگر تلاش کنید. اگر مشکل ادامه داشت، از صفحهٔ خانه دوباره وارد شوید.
      </p>
      {error.digest ? <p className="num mt-3 text-[11px] text-ink-soft">کد پیگیری: {error.digest}</p> : null}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="border border-ink bg-ink px-5 py-2.5 text-[14px] font-bold text-paper-2 hover:bg-ink-2"
        >
          تلاش دوباره
        </button>
        <Link href="/" className="border border-rule px-5 py-2.5 text-[14px] text-ink hover:border-ink">
          بازگشت به خانه
        </Link>
      </div>
    </main>
  );
}
