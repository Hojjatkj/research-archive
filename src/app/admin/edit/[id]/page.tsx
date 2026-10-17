import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getItemById } from "@/lib/data";
import { Editor, type ItemDTO } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  const { id } = await params;
  const item = await getItemById(Number(id));
  if (!item) notFound();

  const saved = (await searchParams).saved === "1";

  const dto: ItemDTO = {
    id: item.id,
    title: item.title,
    slug: item.slug,
    type: item.type,
    course: item.course,
    summary: item.summary,
    tags: item.tags ?? [],
    status: item.status === "published" ? "published" : "draft",
    content: item.content ?? [],
    coverFileId: item.coverFileId ?? null,
  };

  return <Editor initial={dto} savedFlash={saved} />;
}
