import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SettingsForm from "@/app/settings/settings-form";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  return (
    <SettingsForm
      user={{
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified,
        createdAt: session.user.createdAt.toISOString(),
      }}
    />
  );
}
