import "server-only";

import { Resend } from "resend";

const DEVELOPMENT_SENDER = "FixLog <onboarding@resend.dev>";

type PasswordResetEmail = {
  email: string;
  name?: string | null;
  resetUrl: string;
};

type EmailVerificationEmail = {
  email: string;
  name?: string | null;
  verificationUrl: string;
};

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: PasswordResetEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const recipientName = name?.trim() || "there";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: DEVELOPMENT_SENDER,
    to: [email],
    subject: "Reset your FixLog password",
    text: [
      `Hi ${recipientName},`,
      "",
      "We received a request to reset your FixLog password.",
      `Reset your password: ${resetUrl}`,
      "",
      "If you did not request a password reset, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="background:#fafafa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;">FixLog</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Reset your password</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hi ${escapeHtml(recipientName)},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">We received a request to reset your FixLog password.</p>
          <a href="${escapeHtml(resetUrl)}" style="display:inline-block;background:#18181b;border-radius:8px;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Reset password</a>
          <p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#52525b;">If you did not request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Unable to send password reset email: ${error.message}`);
  }
}

export async function sendEmailVerificationEmail({
  email,
  name,
  verificationUrl,
}: EmailVerificationEmail) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  const recipientName = name?.trim() || "there";
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: DEVELOPMENT_SENDER,
    to: [email],
    subject: "Verify your FixLog email",
    text: [
      `Hi ${recipientName},`,
      "",
      "Thanks for creating a FixLog account. Verify your email address to finish setting up your account.",
      `Verify your email: ${verificationUrl}`,
      "",
      "This link expires in one hour.",
      "If you did not create a FixLog account, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="background:#fafafa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#18181b;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
          <p style="margin:0 0 24px;font-size:18px;font-weight:700;">FixLog</p>
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;">Verify your email</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Hi ${escapeHtml(recipientName)},</p>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.5;">Thanks for creating a FixLog account. Verify your email address to finish setting up your account.</p>
          <a href="${escapeHtml(verificationUrl)}" style="display:inline-block;background:#18181b;border-radius:8px;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Verify email</a>
          <p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#52525b;">This link expires in one hour.</p>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.5;color:#52525b;">If you did not create a FixLog account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Unable to send verification email: ${error.message}`);
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}
