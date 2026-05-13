import nodemailer from "nodemailer";
import { render } from "@react-email/render";
import { VerificationEmail } from "@/components/emails/VerificationEmail";
import { PasswordResetEmail } from "@/components/emails/PasswordResetEmail";
import { CourseInviteEmail } from "@/components/emails/CourseInviteEmail";

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Singleton transporter — reused across server action calls
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify SMTP connection on startup (non-blocking — logs only, never throws)
transporter.verify().then(() => {
  console.log("[Mail] Gmail SMTP connection verified");
}).catch((err: Error) => {
  console.error("[Mail] SMTP connection failed:", err.message);
});

async function send(opts: nodemailer.SendMailOptions): Promise<{ success: true; messageId: string } | { error: string }> {
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
      from: `"CSCN Academy" <${process.env.GMAIL_USER}>`,
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
      from: `"CSCN Security" <${process.env.GMAIL_USER}>`,
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
    from: `"CSCN Academy" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `You've been invited to co-instruct "${courseTitle}" — CSCN Academy`,
    html,
  });
};
