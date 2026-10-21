import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getItemById } from "@/lib/data";
import { Editor, type ItemDTO } from "@/components/Editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ویرایش مطلب | مدیریت آرشیو" };

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  await requireAdmin(`/dashboard/edit/${id}`);

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const item = await getItemById(numericId);
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
    hiddenByAdmin: item.hiddenByAdmin,
    moderationNote: item.moderationNote,
  };

  return <Editor initial={dto} savedFlash={saved} />;
}
