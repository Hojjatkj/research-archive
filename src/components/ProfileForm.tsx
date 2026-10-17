"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProfileDTO = {
  id?: number;
  name: string;
  university: string;
  course: string;
  email: string;
  bio: string;
};

export function ProfileForm({ initial }: { initial?: ProfileDTO }) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [university, setUniversity] = useState(initial?.university ?? "");
  const [course, setCourse] = useState(initial?.course ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), university: university.trim(), course: course.trim(), email: email.trim(), bio: bio.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "خطا");
      setFlash("ذخیره شد.");
      window.setTimeout(() => setFlash(null), 3000);
      router.refresh();
    } catch {
      setFlash("ذخیره ناموفق بود.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass = "w-full border border-rule bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/60 focus:border-ink focus:outline-none";

  return (
    <div className="mx-auto max-w-[640px] px-5 py-10 lg:px-8">
      <h1 className="text-[20px] font-black text-ink">ویرایش اطلاعات «دربارهٔ من»</h1>
      <form onSubmit={submit} className="mt-6 space-y-5 border border-rule bg-paper-2 px-6 py-8 shadow-[0_18px_50px_rgba(22,35,63,0.10)]">
        <p className="text-[12px] text-ink-soft">چند فیلد ضروری برای نمایش در صفحهٔ دربارهٔ من.</p>
        <div>
          <label htmlFor="p-name" className="mb-1.5 block text-[13px] font-bold text-ink-2">نام *</label>
          <input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-university" className="mb-1.5 block text-[13px] font-bold text-ink-2">دانشگاه</label>
          <input id="p-university" value={university} onChange={(e) => setUniversity(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-course" className="mb-1.5 block text-[13px] font-bold text-ink-2">درس / مقطع</label>
          <input id="p-course" value={course} onChange={(e) => setCourse(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-email" className="mb-1.5 block text-[13px] font-bold text-ink-2">ایمیل</label>
          <input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="p-bio" className="mb-1.5 block text-[13px] font-bold text-ink-2">بیوگرافی کوتاه</label>
          <textarea id="p-bio" rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className={`${inputClass} resize-y`} />
        </div>
        {flash ? <p className="border-e-4 border-moss bg-moss/10 px-3.5 py-2.5 text-[13px] text-moss">{flash}</p> : null}
        <button type="submit" disabled={busy} className="w-full border border-ink bg-ink px-4 py-3 text-[15px] font-bold text-paper-2 hover:bg-ink-2 disabled:opacity-60">{busy ? "در حال ذخیره…" : "ذخیره"}</button>
      </form>
    </div>
  );
}
