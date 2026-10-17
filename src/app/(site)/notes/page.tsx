import { SectionIndex } from "@/components/SectionIndex";

export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <SectionIndex
      title="جزوه‌ها"
      lead="جزوه‌های درسی، خلاصهٔ مقاله‌ها، فهرست اصطلاحات و یادداشت‌های روزانهٔ پژوهش. مطالب این بخش معمولاً کوتاه و فهرست‌وارند."
      types={["notes"]}
      base="/notes"
      params={await searchParams}
    />
  );
}
