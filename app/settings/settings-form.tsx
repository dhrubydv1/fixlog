"use client";

import SiteHeader from "@/app/components/site-header";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

type SettingsFormProps = {
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
  };
};

const inputClassName =
  "fl-field";

export default function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [savedName, setSavedName] = useState(user.name);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    const trimmedName = name.trim();

    if (!trimmedName) {
      setProfileMessage("Please enter your name.");
      return;
    }

    if (trimmedName.length > 80) {
      setProfileMessage("Your name must be 80 characters or fewer.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const result = await authClient.updateUser({ name: trimmedName });

      if (result.error) {
        setProfileMessage(result.error.message ?? "Unable to update your profile.");
        return;
      }

      setName(trimmedName);
      setSavedName(trimmedName);
      setProfileMessage("Profile updated successfully.");
    } catch {
      setProfileMessage("Unable to reach FixLog. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage("Please complete all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (result.error) {
        setPasswordMessage(result.error.message ?? "Unable to change your password.");
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage(
        revokeOtherSessions
          ? "Password updated. Other sessions have been signed out."
          : "Password updated successfully.",
      );
    } catch {
      setPasswordMessage("Unable to reach FixLog. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleSignOut() {
    setSignOutMessage(null);
    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        setSignOutMessage(result.error.message ?? "Unable to log out.");
        return;
      }

      router.replace("/auth");
      router.refresh();
    } catch {
      setSignOutMessage("Unable to reach FixLog. Please try again.");
    } finally {
      setIsSigningOut(false);
    }
  }

  async function handleDeleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteMessage(null);

    if (deleteConfirmation !== "DELETE") {
      setDeleteMessage("Type DELETE to confirm account deletion.");
      return;
    }

    if (!deletePassword) {
      setDeleteMessage("Enter your current password to delete your account.");
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await authClient.deleteUser({ password: deletePassword });

      if (result.error) {
        setDeleteMessage(result.error.message ?? "Unable to delete your account.");
        return;
      }

      router.replace("/auth");
      router.refresh();
    } catch {
      setDeleteMessage("Unable to reach FixLog. Please try again.");
    } finally {
      setIsDeletingAccount(false);
    }
  }

  return (
    <main className="fl-page">
      <SiteHeader workspace userName={savedName} onSignOut={handleSignOut} isSigningOut={isSigningOut} />

      <div className="fl-container">
        <header className="fl-page-heading">
          <p className="fl-eyebrow">Account settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Profile &amp; security</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">Manage your FixLog profile and account security.</p>
        </header>

        <div className="grid gap-2">
          <SettingsSection title="Profile" description="Your personal details and account status.">
            <form onSubmit={handleProfileSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <label htmlFor="display-name" className="text-sm font-medium text-zinc-800">Name</label>
                <input id="display-name" type="text" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={80} disabled={isSavingProfile} className={inputClassName} />
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">Email</span>
                <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700">{user.email}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-zinc-800">Email verification</p>
                  <p className={`mt-1 text-sm font-medium ${user.emailVerified ? "text-emerald-700" : "text-amber-700"}`}>
                    {user.emailVerified ? "Verified ✓" : "Not verified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-800">Account created</p>
                  <p className="mt-1 text-sm text-zinc-600">{formatDate(user.createdAt)}</p>
                </div>
              </div>
              {profileMessage && <StatusMessage message={profileMessage} isSuccess={profileMessage === "Profile updated successfully."} />}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">Signed in as {savedName}.</p>
                <button type="submit" disabled={isSavingProfile} className="fl-button fl-button-primary">
                  {isSavingProfile ? "Saving..." : "Save name"}
                </button>
              </div>
            </form>
          </SettingsSection>

          <SettingsSection title="Security" description="Update your password or end this session.">
            <form onSubmit={handlePasswordSubmit} className="grid gap-5">
              <PasswordField id="current-password" label="Current password" value={currentPassword} onChange={setCurrentPassword} disabled={isChangingPassword} autoComplete="current-password" />
              <div className="grid gap-5 sm:grid-cols-2">
                <PasswordField id="new-password" label="New password" value={newPassword} onChange={setNewPassword} disabled={isChangingPassword} autoComplete="new-password" />
                <PasswordField id="confirm-password" label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} disabled={isChangingPassword} autoComplete="new-password" />
              </div>
              <label className="flex items-start gap-3 text-sm text-zinc-700">
                <input type="checkbox" checked={revokeOtherSessions} onChange={(event) => setRevokeOtherSessions(event.target.checked)} disabled={isChangingPassword} className="mt-0.5 size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900" />
                <span>Sign out of other devices after changing my password.</span>
              </label>
              {passwordMessage && <StatusMessage message={passwordMessage} isSuccess={passwordMessage.startsWith("Password updated")} />}
              <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-zinc-500">Use a strong, unique password with at least 8 characters.</p>
                <button type="submit" disabled={isChangingPassword} className="fl-button fl-button-primary">
                  {isChangingPassword ? "Updating..." : "Change password"}
                </button>
              </div>
            </form>
            <div className="mt-6 border-t border-zinc-100 pt-5">
              {signOutMessage && <StatusMessage message={signOutMessage} isSuccess={false} />}
              <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="fl-button">
                {isSigningOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </SettingsSection>

          <section className="fl-danger-zone" aria-labelledby="danger-zone-heading">
            <div className="border-b border-red-200 px-5 py-4 sm:px-6">
              <p className="text-sm font-medium text-red-700">Account management</p>
              <h2 id="danger-zone-heading" className="mt-1 text-lg font-semibold tracking-tight text-red-950">Danger zone</h2>
              <p className="mt-1 text-sm leading-6 text-red-800">Deleting your account permanently removes your FixLog data.</p>
            </div>
            <form onSubmit={handleDeleteAccount} className="grid gap-5 p-5 sm:p-6">
              <div className="grid gap-2">
                <label htmlFor="delete-confirmation" className="text-sm font-medium text-zinc-800">Type DELETE to confirm</label>
                <input id="delete-confirmation" type="text" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} autoComplete="off" disabled={isDeletingAccount} className={inputClassName} />
              </div>
              <PasswordField id="delete-password" label="Current password" value={deletePassword} onChange={setDeletePassword} disabled={isDeletingAccount} autoComplete="current-password" />
              {deleteMessage && <StatusMessage message={deleteMessage} isSuccess={false} />}
              <button type="submit" disabled={isDeletingAccount} className="fl-button fl-button-danger w-fit">
                {isDeletingAccount ? "Deleting account..." : "Delete account"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="fl-setting-section">
      <div className="fl-setting-heading">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function PasswordField({ id, label, value, onChange, disabled, autoComplete }: { id: string; label: string; value: string; onChange: (value: string) => void; disabled: boolean; autoComplete: "current-password" | "new-password" }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800">{label}</label>
      <div className="relative">
        <input id={id} type={isVisible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={autoComplete} disabled={disabled} className={`${inputClassName} pr-11`} />
        <PasswordVisibilityButton visible={isVisible} onClick={() => setIsVisible((visible) => !visible)} disabled={disabled} />
      </div>
    </div>
  );
}

function PasswordVisibilityButton({ visible, onClick, disabled }: { visible: boolean; onClick: () => void; disabled: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-zinc-500 transition hover:text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">{visible ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m3 3 18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.4 4.8 10 8-.2 1-1 2.8-3.1 4.5M6.6 6.6C4.2 8.2 2.7 10.7 2 12c.6 1.2 4.5 8 10 8 1.4 0 2.7-.3 3.8-.8" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button>;
}

function StatusMessage({ message, isSuccess }: { message: string; isSuccess: boolean }) {
  return (
    <p role={isSuccess ? "status" : "alert"} className={`rounded-lg border px-3.5 py-3 text-sm ${isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-700"}`}>
      {message}
    </p>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}
