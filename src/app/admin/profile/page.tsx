import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getProfile, saveProfile } from "@/lib/profile";
import { ProfileForm } from "@/components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  const profile = await getProfile();
  return <ProfileForm initial={profile ?? undefined} />;
}
