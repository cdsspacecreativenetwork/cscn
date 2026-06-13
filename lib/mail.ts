import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";
import { CourseInviteEmail } from "@/components/emails/CourseInviteEmail";

function getAppUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";
  const withProtocol = raw.startsWith("http") ? raw : `https://${raw}`;
  return withProtocol.replace(/\/$/, "");
}

const domain = getAppUrl();
const defaultFrom = process.env.EMAIL_FROM || process.env.GMAIL_USER || "no-reply@cscn.app";

// Singleton transporter — reused across server action calls
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify SMTP connection on startup (non-blocking — logs only, never throws)
let smtpVerificationStarted = false;

function verifySmtpOnce() {
  if (smtpVerificationStarted) return;
  smtpVerificationStarted = true;
  transporter.verify().then(() => {
    console.log("[Mail] Gmail SMTP connection verified");
  }).catch((err: Error) => {
    console.error("[Mail] SMTP connection failed:", err.message);
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function send(opts: nodemailer.SendMailOptions): Promise<{ success: true; messageId: string } | { error: string }> {
  verifySmtpOnce();
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return { error: "Email provider is not configured. Set Gmail SMTP credentials." };
  }

  try {
    const info = await transporter.sendMail(opts);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[Mail] send error:", message);
    return { error: message };
  }
}

export const sendVerificationEmail = async (email: string, token: string, name?: string) => {
  try {
    const confirmLink = `${domain}/auth/new-verification?token=${token}`;
    const html = await render(
      VerificationEmail({
        confirmLink,
        userName: name?.split(" ")[0] || "Learner",
      })
    );

    return send({
      from: `"CSCN Academy" <${defaultFrom}>`,
      to: email,
      subject: "Verify your email — CSCN Academy",
      html,
    });
  } catch (error) {
    console.error(error);
  }
};

export const sendPasswordResetEmail = async (email: string, token: string, name?: string) => {
  try {
    const resetLink = `${domain}/auth/new-password?token=${token}`;
    const html = await render(
      PasswordResetEmail({
        resetLink,
        userName: name?.split(" ")[0] || "Learner",
      })
    );

    const received = await send({
      from: `"CSCN Security" <${defaultFrom}>`,
      to: email,
      subject: "Reset your password — CSCN Academy",
      html,
    });

    return received;
  } catch (error) {
    console.error(error);
  }
};

export const sendCourseInviteEmail = async (
  email: string,
  token: string,
  courseTitle: string,
  role: string,
  inviterName?: string
) => {
  const inviteLink = `${domain}/invite/course/${token}`;
  const html = await render(
    CourseInviteEmail({
      inviteLink,
      courseTitle,
      role,
      inviterName,
    })
  );
  return send({
    from: `"CSCN Academy" <${defaultFrom}>`,
    to: email,
    subject: `You've been invited to co-instruct "${courseTitle}" — CSCN Academy`,
    html,
  });
};

export const sendPasswordChangeOTPEmail = async (email: string, code: string, name?: string) => {
  try {
    const html = `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; padding: 24px; color: #040B37; max-width: 600px; margin: 0 auto; border: 1px solid #E3E8F4; border-radius: 16px; background-color: #FFFFFF;">
        <h2 style="font-size: 20px; font-weight: 700; color: #1C4ED1; margin-bottom: 16px;">CSCN Security Notification</h2>
        <p style="font-size: 14px; font-weight: 500; color: #4B5563; line-height: 1.5;">
          Hello ${name?.split(" ")[0] || "User"},
        </p>
        <p style="font-size: 14px; font-weight: 500; color: #4B5563; line-height: 1.5;">
          We received a request to update your account password. Please enter the following 6-digit verification code to proceed:
        </p>
        <div style="background-color: #F8FAFB; border: 1px solid #E3E8F4; padding: 16px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 4px; color: #040B37; border-radius: 10px; margin: 24px 0;">
          ${code}
        </div>
        <p style="font-size: 11px; font-weight: 500; color: #9CA3AF; line-height: 1.4;">
          This code will expire in 15 minutes. If you did not make this request, please change your credentials immediately or contact support.
        </p>
      </div>
    `;

    return send({
      from: `"CSCN Security" <${defaultFrom}>`,
      to: email,
      subject: "Verification code for password update — CSCN Academy",
      html,
    });
  } catch (error) {
    console.error(error);
  }
};

export const sendLiveSessionReminderEmail = async ({
  email,
  name,
  sessionTitle,
  sessionTime,
  reminderLabel,
  scheduleUrl = `${domain}/dashboard/schedule`,
}: {
  email: string;
  name?: string | null;
  sessionTitle: string;
  sessionTime: string;
  reminderLabel: string;
  scheduleUrl?: string;
}) => {
  const firstName = name?.split(" ")[0] || "Learner";
  const safeFirstName = escapeHtml(firstName);
  const safeSessionTitle = escapeHtml(sessionTitle);
  const safeSessionTime = escapeHtml(sessionTime);
  const safeReminderLabel = escapeHtml(reminderLabel);
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 24px; color: #040B37; max-width: 600px; margin: 0 auto; border: 1px solid #E3E8F4; border-radius: 18px; background-color: #FFFFFF;">
      <p style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1C4ED1; margin: 0 0 12px;">Live session reminder</p>
      <h1 style="font-size: 24px; line-height: 1.25; margin: 0 0 12px; color: #040B37;">${safeReminderLabel}</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 18px;">
        Hi ${safeFirstName}, this is a reminder that <strong>${safeSessionTitle}</strong> is scheduled for ${safeSessionTime}.
      </p>
      <a href="${scheduleUrl}" style="display: inline-block; background: linear-gradient(90deg, #1C4ED1, #0A7CFF); color: #FFFFFF; text-decoration: none; font-weight: 800; padding: 13px 20px; border-radius: 10px;">
        View session
      </a>
      <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; margin: 22px 0 0;">
        You are receiving this because you enabled reminders for this CSCN live session.
      </p>
    </div>
  `;

  return send({
    from: `"CSCN Academy" <${defaultFrom}>`,
    to: email,
    subject: `${reminderLabel}: ${sessionTitle}`,
    html,
  });
};

export const sendLiveSessionUpdateEmail = async ({
  email,
  name,
  sessionTitle,
  message,
  updateLabel,
  scheduleUrl = `${domain}/dashboard/schedule`,
}: {
  email: string;
  name?: string | null;
  sessionTitle: string;
  message: string;
  updateLabel: string;
  scheduleUrl?: string;
}) => {
  const firstName = name?.split(" ")[0] || "Learner";
  const safeFirstName = escapeHtml(firstName);
  const safeSessionTitle = escapeHtml(sessionTitle);
  const safeMessage = escapeHtml(message);
  const safeUpdateLabel = escapeHtml(updateLabel);
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; padding: 24px; color: #040B37; max-width: 600px; margin: 0 auto; border: 1px solid #E3E8F4; border-radius: 18px; background-color: #FFFFFF;">
      <p style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1C4ED1; margin: 0 0 12px;">Live session update</p>
      <h1 style="font-size: 24px; line-height: 1.25; margin: 0 0 12px; color: #040B37;">${safeUpdateLabel}</h1>
      <p style="font-size: 15px; line-height: 1.6; color: #4B5563; margin: 0 0 18px;">
        Hi ${safeFirstName}, <strong>${safeSessionTitle}</strong> has an update: ${safeMessage}
      </p>
      <a href="${scheduleUrl}" style="display: inline-block; background: linear-gradient(90deg, #1C4ED1, #0A7CFF); color: #FFFFFF; text-decoration: none; font-weight: 800; padding: 13px 20px; border-radius: 10px;">
        View schedule
      </a>
      <p style="font-size: 12px; line-height: 1.5; color: #9CA3AF; margin: 22px 0 0;">
        You are receiving this because you are enrolled in a course affected by this CSCN live session.
      </p>
    </div>
  `;

  return send({
    from: `"CSCN Academy" <${defaultFrom}>`,
    to: email,
    subject: `${updateLabel}: ${sessionTitle}`,
    html,
  });
};
