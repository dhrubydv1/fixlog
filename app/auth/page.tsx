import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuthForm from "@/app/auth/auth-form";
import { auth } from "@/lib/auth";

export default async function AuthPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  return <AuthForm />;
}
