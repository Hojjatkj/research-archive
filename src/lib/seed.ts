import { count } from "drizzle-orm";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/db";
import { files, items, type NewItem } from "@/db/schema";
import { blocksToPlain, type Block } from "@/lib/blocks";

const SAMPLE_TAG = "محتوای نمونه";

const SAMPLE_ARTICLE: Block[] = [
  {
    type: "paragraph",
    dir: "rtl",
    text: "این مطلب **صرفاً یک نمونهٔ نمایشی** است تا شیوهٔ چیدمان متن، تیترها، فهرست‌ها، جدول‌ها، تصاویر، کد و منابع را نشان دهد. هیچ ادعای پژوهشی، داده یا استنادی در آن مطرح نشده است.",
  },
  {
    type: "heading",
    level: 2,
    dir: "rtl",
    text: "۱. چرا این بایگانی ساخته شده است",
  },
  {
    type: "paragraph",
    dir: "rtl",
    text: "هدف، یک مرجع واحد برای نگهداری متن‌های پژوهشی، تکالیف، ارائه‌ها و جزوه‌هاست. هر مطلب در یکی از بخش‌های «تکالیف و پژوهش»، «ارائه‌ها» یا «جزوه‌ها» قرار می‌گیرد و برچسب، درس، تاریخ انتشار و پیوست‌های خودش را دارد.",
  },
  {
    type: "paragraph",
    dir: "rtl",
    text: "در متن فارسی می‌توان واژه‌های انگلیسی مانند {{ltr Research Archive}} یا {{ltr HTML}} را درج کرد و جهت جمله به‌هم نمی‌ریزد. برای یک پاراگراف کامل انگلیسی هم می‌توان جهت همان بلوک را {{ltr LTR}} کرد:",
  },
  {
    type: "paragraph",
    dir: "ltr",
    text: "This paragraph is written in English and is rendered left-to-right, while the page around it stays right-to-left. Inline code such as `dir=\"ltr\"` and links like [example.com](https://example.com) keep their own direction.",
  },
  {
    type: "heading",
    level: 2,
    dir: "rtl",
    text: "۲. ساختارهای پایه",
  },
  {
    type: "list",
    ordered: true,
    dir: "rtl",
    items: [
      "**فهرست شماره‌دار** برای گام‌های اجرایی یا روش کار.",
      "*فهرست ساده* برای نکته‌های کوتاه کنار هم.",
      "درج `کد درون‌خطی` برای نام فایل‌ها، دستورها یا متغیرها.",
      "پیوند به منابع بیرونی: [راهنمای نگارش](https://example.com).",
    ],
  },
  {
    type: "quote",
    dir: "rtl",
    text: "نقل‌قول برای برجسته‌سازی یک گزاره یا جملهٔ کلیدی به‌کار می‌رود و با خط کناری از متن اصلی جدا می‌شود.",
    cite: "نمونهٔ قالب‌بندی — بدون استناد پژوهشی",
  },
  {
    type: "heading",
    level: 2,
    dir: "rtl",
    text: "۳. جدول و تصویر",
  },
  {
    type: "table",
    dir: "rtl",
    caption: "نمونهٔ جدول مقایسه‌ای — سطر اول، سرستون است",
    header: ["عنصر", "کاربرد", "جهت متن"],
    rows: [
      ["پاراگراف فارسی", "متن اصلی گزارش", "راست‌به‌چپ"],
      ["پاراگراف انگلیسی", "چکیده یا نقل از منبع", "چپ‌به‌راست"],
      ["جدول داده", "ارقام و مقایسه‌ها", "قابل تنظیم"],
    ],
  },
  {
    type: "image",
    fileId: 0,
    alt: "میز کار استاد با دفتر ثبت، خودنویس و عینک",
    caption: "نمونهٔ تصویر با توضیح و متن جایگزین — تصویر از فایل‌های بارگذاری‌شدهٔ خود بایگانی نمایش داده می‌شود.",
  },
  {
    type: "heading",
    level: 2,
    dir: "rtl",
    text: "۴. کد و پیوست",
  },
  {
    type: "code",
    lang: "js",
    code: "// نمونهٔ بلوک کد با جهت چپ‌به‌راست\nfunction slugify(title) {\n  return title.trim().replace(/\\s+/g, \"-\");\n}",
  },
  {
    type: "file",
    fileId: 0,
    label: "پیوست نمونه: تصویر اصلی مطلب (برای آزمایش دریافت فایل)",
  },
  {
    type: "embed",
    dir: "ltr",
    url: "https://example.com",
    label: "نمونهٔ پیوند به یک منبع بیرونی",
  },
  {
    type: "heading",
    level: 2,
    dir: "rtl",
    text: "۵. منابع",
  },
  {
    type: "references",
    dir: "rtl",
    items: [
      "نام خانوادگی نویسنده، نام اثر، نام نشر، سال — (قالب نمونه، بدون استناد واقعی)",
      "عنوان مقاله، نام مجله، شمارهٔ جلد و صفحه، سال — قالب نمونه، بدون استناد واقعی",
    ],
  },
];

const OTHER_ITEMS: NewItem[] = [
  {
    slug: "sample-assignment-template",
    title: "نمونهٔ تکلیف: قالب گزارش پروژهٔ درسی",
    type: "assignment",
    course: "کارگاه پژوهش",
    summary:
      "یک قالب آماده برای تکالیف و گزارش‌های پروژه؛ شامل بخش‌بندی مسئله، روش، یافته‌های توصیفی و پیوست‌ها. محتوای این مطلب نمونه است.",
    tags: [SAMPLE_TAG, "قالب گزارش"],
    status: "published",
    content: [
      {
        type: "paragraph",
        dir: "rtl",
        text: "این مطلب یک **قالب نمونه** است؛ هر بخش را با محتوای واقعی تکلیف خودتان جایگزین کنید. هیچ داده یا نتیجه‌ای در آن واقعی نیست.",
      },
      { type: "heading", level: 2, dir: "rtl", text: "ساختار پیشنهادی گزارش" },
      {
        type: "list",
        ordered: true,
        dir: "rtl",
        items: [
          "بیان مسئله و پرسش اصلی",
          "روش کار و ابزارهای به‌کار رفته",
          "یافته‌ها (در صورت وجود)",
          "محدودیت‌ها و گام‌های بعدی",
          "پیوست‌ها و فایل‌های خام",
        ],
      },
      {
        type: "paragraph",
        dir: "rtl",
        text: "برای هر تکلیف می‌توان فایل خام، تصویر و جدول پیوست کرد تا استاد راهنما همه چیز را در یک صفحه ببیند.",
      },
    ],
  },
  {
    slug: "sample-presentation-structure",
    title: "نمونهٔ ارائه: چیدمان اسلایدهای جلسهٔ ارائه",
    type: "presentation",
    course: "سمینار پیشرفته",
    summary:
      "چارچوب یک ارائهٔ کوتاه دانشگاهی: اسلاید عنوان، پرسش، روش، یافته‌ها و جمع‌بندی — به‌همراه پیوند فایل ارائه. محتوای این مطلب نمونه است.",
    tags: [SAMPLE_TAG, "ارائه"],
    status: "published",
    content: [
      {
        type: "paragraph",
        dir: "rtl",
        text: "قالب نمایشی برای ارائه‌ها: هر ارائه می‌تواند شامل لینک ویدیو، فایل پیوست و خلاصهٔ گفتار باشد.",
      },
      {
        type: "list",
        ordered: true,
        dir: "rtl",
        items: [
          "اسلاید نخست: عنوان، نام ارائه‌دهنده، نام استاد و تاریخ",
          "پرسش پژوهش و انگیزه",
          "روش کار",
          "یافته‌ها یا پیشرفت کار",
          "گام‌های بعدی و پرسش از حاضران",
        ],
      },
      {
        type: "embed",
        dir: "ltr",
        url: "https://example.com",
        label: "نمونهٔ پیوند به ویدیو یا فایل ارائه",
      },
    ],
  },
  {
    slug: "sample-notes-framework",
    title: "نمونهٔ جزوه: چارچوب یادداشت‌برداری از مقاله",
    type: "notes",
    course: "روش تحقیق",
    summary:
      "یک چارچوب ساده برای جزوه‌نویسی: پرسش مقاله، روش، نکته‌های کلیدی، پرسش‌های باز و اصطلاحات. محتوای این مطلب نمونه است.",
    tags: [SAMPLE_TAG, "جزوه‌نویسی"],
    status: "published",
    content: [
      {
        type: "paragraph",
        dir: "rtl",
        text: "جزوه‌ها معمولاً کوتاه‌اند و به‌صورت فهرست‌های کاربردی نوشته می‌شوند. این مطلب یک قالب نمونه است.",
      },
      {
        type: "list",
        ordered: false,
        dir: "rtl",
        items: [
          "**پرسش اصلی:** مقاله دقیقاً می‌خواهد چه چیزی را روشن کند؟",
          "**روش:** داده از کجا آمده و چطور تحلیل شده است؟",
          "**نکته‌های کلیدی:** سه تا پنج نکتهٔ قابل استفاده در کار خودمان.",
          "**پرسش‌های باز:** چه چیزی هنوز پاسخ ندارد؟",
        ],
      },
      {
        type: "table",
        dir: "rtl",
        caption: "نمونهٔ جدول اصطلاحات",
        header: ["اصطلاح", "توضیح کوتاه"],
        rows: [
          ["متغیر وابسته", "آنچه اندازه‌گیری می‌شود"],
          ["متغیر مستقل", "آنچه تغییر داده می‌شود"],
        ],
      },
    ],
  },
];

export async function ensureSeed(): Promise<void> {
  try {
    await runSeed();
  } catch {
    // Seeding is best-effort: a concurrent first request may race us to the
    // insert, in which case the data already exists and we simply move on.
  }
}

async function runSeed(): Promise<void> {
  const [{ n }] = await db.select({ n: count() }).from(items);
  if (Number(n) > 0) return;

  let imageId = 0;
  try {
    const buf = await readFile(path.join(process.cwd(), "public/images/register.jpg"));
    const inserted = await db
      .insert(files)
      .values({
        name: "register.jpg",
        mime: "image/jpeg",
        size: buf.length,
        alt: "میز کار استاد با دفتر ثبت و خودنویس",
        caption: "میز کار استاد راهنما",
        data: buf,
      })
      .returning({ id: files.id });
    imageId = inserted[0].id;
  } catch {
    imageId = 0;
  }

  const articleContent = SAMPLE_ARTICLE.map((block) =>
    block.type === "image" || block.type === "file"
      ? { ...block, fileId: imageId }
      : block,
  );

  const now = new Date();

  await db.insert(items).values([
    {
      slug: "sample-research-article",
      title: "نمونهٔ مطلب آزمایشی: ساختار یک گزارش پژوهشی",
      type: "research",
      course: "کارگاه پژوهش",
      summary:
        "مطلبی نمونه برای نمایش قابلیت‌های ویرایشگر: تیتر، متن فارسی و انگلیسی، فهرست، نقل‌قول، جدول، تصویر، کد، پیوست و منابع. محتوای پژوهشی واقعی ندارد.",
      tags: [SAMPLE_TAG, "راهنمای نگارش"],
      status: "published",
      content: articleContent,
      plain: blocksToPlain(articleContent),
      publishedAt: now,
    },
    ...OTHER_ITEMS.map((item) => ({
      ...item,
      plain: blocksToPlain(item.content as Block[]),
      publishedAt: now,
    })),
  ]);
}
