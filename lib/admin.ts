import "server-only";

export function isAdmin(sessionUserEmail: string | null | undefined) {
  if (!sessionUserEmail) {
    return false;
  }

  const adminEmails = process.env.ADMIN_EMAILS
    ?.split(",")
    .map((email) => email.trim().toLocaleLowerCase())
    .filter(Boolean) ?? [];

  return adminEmails.includes(sessionUserEmail.trim().toLocaleLowerCase());
}
