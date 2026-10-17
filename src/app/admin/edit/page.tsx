import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function NewItemPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <Editor initial={null} />;
}
