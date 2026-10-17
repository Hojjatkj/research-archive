"use client";

import { useEffect } from "react";
import { EmptySheet } from "@/components/Brand";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("archive error:", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <EmptySheet className="h-20 w-20 text-ink/30" />
      <p className="num mt-8 text-[12px] text-ink-soft">خطا در نمایش این صفحه</p>
      <h1 className="mt-4 text-[clamp(1.8rem,5vw,2.6rem)] font-black leading-[1.5] text-ink">
        این صفحه باز نشد
      </h1>
      <p className="mt-5 text-[15px] leading-9 text-ink-soft">
        مشکلی در ارتباط با پایگاه داده پیش آمد. اگر مطلبی را دوباره ذخیره کرده‌اید، ممکن
        است نشانی آن تکراری باشد — در این حالت عنوان یا نشانی دیگری امتحان کنید.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="border border-ink bg-ink px-5 py-2.5 text-[14px] font-bold text-paper-2 hover:bg-ink-2"
        >
          تلاش دوباره
        </button>
        <a
          href="/admin"
          className="border border-rule px-5 py-2.5 text-[14px] text-ink hover:border-ink"
        >
          بازگشت به مدیریت
        </a>
        <a
          href="/"
          className="border border-rule px-5 py-2.5 text-[14px] text-ink hover:border-ink"
        >
          بازگشت به خانه
        </a>
      </div>
    </main>
  );
}
