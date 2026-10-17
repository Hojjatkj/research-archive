import { SectionIndex } from "@/components/SectionIndex";

export const dynamic = "force-dynamic";

export default async function PresentationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <SectionIndex
      title="ارائه‌ها"
      lead="اسلایدها، فایل‌های ارائه، ویدیوی جلسه‌ها و خلاصهٔ گفتار. برای هر ارائه می‌توان پیوند ویدیو، پیوست و یادداشت‌های جلسه را نگه داشت."
      types={["presentation"]}
      base="/presentations"
      params={await searchParams}
    />
  );
}
