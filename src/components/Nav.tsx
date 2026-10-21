"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/archive", label: "تکالیف و پژوهش" },
  { href: "/presentations", label: "ارائه‌ها" },
  { href: "/notes", label: "جزوه‌ها" },
  { href: "/students", label: "اطلاعات دانشجو" },
];

export function Nav({ user }: { user: { name: string } | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <nav aria-label="بخش‌های اصلی" className="no-print hidden flex-1 justify-center lg:flex">
        <ul className="flex items-center gap-0.5">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`block px-2.5 py-2 text-[14px] transition-colors xl:px-3 ${
                  isActive(link.href)
                    ? "font-bold text-paper-2 underline decoration-accent decoration-2 underline-offset-8"
                    : "text-paper-2/70 hover:text-paper-2"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="no-print ms-auto flex items-center gap-2">
        {user ? (
          <Link
            href="/dashboard"
            className="border border-paper-2/40 px-3.5 py-2 text-[13px] font-bold text-paper-2 transition-colors hover:bg-paper-2 hover:text-ink"
          >
            میز کار مدیر
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          className="border border-paper-2/30 px-3 py-2 text-[13px] text-paper-2 lg:hidden"
        >
          {open ? "بستن" : "فهرست"}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="no-print absolute inset-x-0 top-full border-t border-paper-2/15 bg-ink px-5 pb-5 pt-2 shadow-[0_20px_40px_rgba(22,35,63,0.25)] lg:hidden">
          <ul className="flex flex-col">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block border-b border-paper-2/10 py-3 text-[15px] ${
                    isActive(link.href) ? "font-bold text-paper-2" : "text-paper-2/75"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          {user ? (
            <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-4 block border border-paper-2/30 py-2.5 text-center text-[14px] font-bold text-paper-2">
              میز کار مدیر
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
