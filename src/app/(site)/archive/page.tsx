import { SectionIndex } from "@/components/SectionIndex";

export const dynamic = "force-dynamic";

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <SectionIndex
      title="تکالیف و پژوهش"
      lead="گزارش‌های پروژه، تکالیف درسی، متن‌های پژوهشی و یادداشت‌های تحلیلی. هر مطلب شامل خلاصه، برچسب، تاریخ انتشار، پیوست و منابع است."
      types={["assignment", "research"]}
      base="/archive"
      showTypeFilter
      params={await searchParams}
    />
  );
}
