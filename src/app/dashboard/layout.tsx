import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireUser("/dashboard");
  return <>{children}</>;
}
