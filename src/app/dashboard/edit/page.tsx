import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مطلب جدید | مدیریت آرشیو" };

export default async function NewItemPage() {
  await requireAdmin("/dashboard/edit");
  return <Editor initial={null} />;
}
