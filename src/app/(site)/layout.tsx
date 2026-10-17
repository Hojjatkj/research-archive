import Link from "next/link";
import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Grain } from "@/components/Grain";
import { Seal } from "@/components/Brand";
import { ownerName } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  await ensureSeed();

  return (
    <div className="relative min-h-screen">
      <Grain />

      <div className="relative z-10">
        <header className="no-print sticky top-0 z-40 border-b border-ink/25 bg-ink text-paper-2">
          <div className="mx-auto flex max-w-[1180px] items-center gap-5 px-5 py-3.5 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <Seal className="h-10 w-10 text-paper-2/90" />
              <span className="leading-tight">
                <span className="block text-[17px] font-black">بایگانی پژوهش</span>
                <span className="num block text-[10px] text-paper-2/60">RESEARCH ARCHIVE</span>
              </span>
            </Link>

            <div className="ms-auto flex items-center gap-4">
              <Nav />
              <Link
                href="/admin/login"
                className="hidden border border-paper-2/30 px-3.5 py-2 text-[13px] text-paper-2/85 transition-colors hover:border-paper-2 hover:text-paper-2 lg:block"
              >
                ورود مدیر
              </Link>
            </div>
          </div>
        </header>

        <main>{children}</main>

        <footer className="no-print mt-24 border-t border-rule bg-paper-2/70">
          <div className="mx-auto grid max-w-[1180px] gap-8 px-5 py-12 md:grid-cols-3 lg:px-8">
            <div>
              <p className="text-[15px] font-black text-ink">بایگانی پژوهش</p>
              <p className="mt-2.5 text-[13px] leading-8 text-ink-soft">
                بایگانی شخصی تکالیف، متن‌های پژوهشی، ارائه‌ها و جزوه‌ها؛ ساخته‌شده برای ارائهٔ
                منظم کار به استاد راهنما.
              </p>
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink-2">بخش‌ها</p>
              <ul className="mt-3 space-y-2 text-[13px] text-ink-soft">
                <li><Link className="hover:text-ink" href="/archive">تکالیف و پژوهش</Link></li>
                <li><Link className="hover:text-ink" href="/presentations">ارائه‌ها</Link></li>
                <li><Link className="hover:text-ink" href="/notes">جزوه‌ها</Link></li>
                <li><Link className="hover:text-ink" href="/review">کارنامهٔ بازبینی</Link></li>
                <li><Link className="hover:text-ink" href="/about">دربارهٔ من</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[13px] font-bold text-ink-2">صاحب امتیاز</p>
              <p className="mt-3 text-[13px] leading-8 text-ink-soft">{ownerName()}</p>
              <span className="mt-4 inline-block text-[12px] text-ink-soft">دسترسی مدیر از طریق ورود جداگانه</span>
            </div>
          </div>
          <div className="border-t border-rule px-5 py-5 text-center">
            <p className="num text-[11px] text-ink-soft">
              RESEARCH ARCHIVE · PERSONAL ACADEMIC PUBLISHING · RTL / LTR
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
