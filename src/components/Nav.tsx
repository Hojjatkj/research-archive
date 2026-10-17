"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "خانه" },
  { href: "/archive", label: "تکالیف و پژوهش" },
  { href: "/presentations", label: "ارائه‌ها" },
  { href: "/notes", label: "جزوه‌ها" },
  { href: "/review", label: "کارنامهٔ بازبینی" },
  { href: "/about", label: "دربارهٔ من" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="no-print">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="border border-paper-2/30 px-3 py-2 text-[14px] text-paper-2 md:hidden"
      >
        {open ? "بستن" : "فهرست"}
      </button>

      <ul
        className={`${
          open ? "flex" : "hidden"
        } absolute inset-x-0 top-full flex-col gap-px border-y border-paper-2/15 bg-ink px-5 pb-4 pt-2 md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:bg-transparent md:p-0`}
      >
        {LINKS.map((link) => {
          const active =
            link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className={`block px-3.5 py-2 text-[15px] transition-colors ${
                  active
                    ? "font-bold text-paper-2 underline decoration-accent decoration-2 underline-offset-8"
                    : "text-paper-2/70 hover:text-paper-2"
                }`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
