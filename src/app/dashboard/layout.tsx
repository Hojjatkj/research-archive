import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/dashboard");
  return <>{children}</>;
}
