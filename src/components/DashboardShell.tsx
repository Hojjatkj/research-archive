import Link from "next/link";
import type { ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/(auth)/actions";
import { Seal } from "./Brand";
import { Grain } from "./Grain";

type Tab = "items" | "profile" | "moderation";

export function DashboardShell({
  user,
  active,
  children,
}: {
  user: SessionUser;
  active: Tab;
  children: ReactNode;
}) {
  const tabs: { id: Tab | "new"; href: string; label: string }[] = [
    { id: "items", href: "/dashboard", label: "مطالب من" },
    { id: "new", href: "/dashboard/edit", label: "+ مطلب جدید" },
    { id: "profile", href: "/dashboard/profile", label: "اطلاعات دانشجو" },
  ];
  if (user.isAdmin) tabs.push({ id: "moderation", href: "/dashboard/moderation", label: "مدیریت کلاس" });

  return (
    <div className="relative min-h-screen">
      <Grain />
      <div className="relative z-10">
        <header className="no-print border-b border-ink/25 bg-ink text-paper-2">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-5 pt-4 lg:px-8">
            <Link href="/" className="flex items-center gap-3">
              <Seal className="h-9 w-9 text-paper-2/90" />
              <span className="leading-tight">
                <span className="block text-[16px] font-black">میز کار</span>
                <span className="block text-[11px] text-paper-2/60">بایگانی پژوهش</span>
              </span>
            </Link>

            <div className="ms-auto flex flex-wrap items-center gap-2.5">
              <span className="hidden text-[13px] text-paper-2/85 sm:inline">{user.fullName}</span>
              {user.isAdmin ? (
                <span className="border border-paper-2/30 px-2 py-0.5 text-[11px] text-paper-2/85">مدیر کلاس</span>
              ) : null}
              <Link
                href={`/students/${user.id}`}
                className="border border-paper-2/30 px-3.5 py-1.5 text-[12.5px] transition-colors hover:border-paper-2"
              >
                صفحهٔ عمومی من
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="border border-paper-2/20 px-3.5 py-1.5 text-[12.5px] text-paper-2/75 transition-colors hover:border-paper-2/60 hover:text-paper-2"
                >
                  خروج
                </button>
              </form>
            </div>
          </div>

          <nav aria-label="بخش‌های میز کار" className="mx-auto mt-3 max-w-[1180px] overflow-x-auto px-5 lg:px-8">
            <ul className="flex min-w-max items-end gap-1">
              {tabs.map((tab) => {
                const isActive = tab.id === active;
                return (
                  <li key={tab.id}>
                    <Link
                      href={tab.href}
                      aria-current={isActive ? "page" : undefined}
                      className={`block px-4 py-2.5 text-[13.5px] transition-colors ${
                        isActive
                          ? "bg-paper font-bold text-ink"
                          : tab.id === "new"
                            ? "text-paper-2 hover:bg-paper-2/10"
                            : "text-paper-2/70 hover:bg-paper-2/10 hover:text-paper-2"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <main className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
