import { headers } from "next/headers";
import { redirect } from "next/navigation";

import Dashboard from "@/app/dashboard";
import { isFixSuggestionsConfigured } from "@/lib/ai";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  return <Dashboard
    user={session.user}
    aiSuggestionsConfigured={isFixSuggestionsConfigured()}
  />;
}
