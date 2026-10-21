import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getItemById } from "@/lib/data";
import { Editor, type ItemDTO } from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ویرایش مطلب | میز کار" };

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/edit/${id}`);

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const item = await getItemById(numericId);
  // Authors only — even the class admin cannot open someone else's item here.
  if (!item || item.userId !== user.id) notFound();

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
    hiddenByAdmin: item.hiddenByAdmin,
    moderationNote: item.moderationNote,
  };

  return <Editor initial={dto} savedFlash={saved} />;
}
