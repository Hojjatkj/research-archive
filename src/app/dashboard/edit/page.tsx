import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مطلب جدید | میز کار" };

export default async function NewItemPage() {
  await requireUser("/dashboard/edit");
  return <Editor initial={null} />;
}
