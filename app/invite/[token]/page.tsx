import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, UserCheck, Clock, XCircle, CheckCircle2, LogIn, UserPlus } from "lucide-react";

import { auth } from "@/auth";
import { getInviteByToken } from "@/data/invite";
import { AcceptButton } from "./AcceptButton";

const roleConfig: Record<string, { label: string; description: string; icon: React.ElementType; color: string; bg: string }> = {
  ADMIN: {
    label: "Admin",
    description: "Full access to manage users, courses, and platform settings.",
    icon: ShieldCheck,
    color: "text-[#1C4ED1]",
    bg: "bg-[#1C4ED1]/10",
  },
  INSTRUCTOR: {
    label: "Instructor",
    description: "Create and manage courses, track student progress, and deliver content.",
    icon: UserCheck,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
};

function formatExpiry(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Expires in less than 1 hour";
  if (hours < 24) return `Expires in ${hours} hour${hours !== 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days} day${days !== 1 ? "s" : ""}`;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invite, session] = await Promise.all([
    getInviteByToken(token),
    auth(),
  ]);

  if (!invite) notFound();

  const isUsed = !!invite.usedAt;
  const isExpired = !isUsed && invite.expiresAt < new Date();
  const isActive = !isUsed && !isExpired;

  const config = roleConfig[invite.role] ?? roleConfig.INSTRUCTOR;
  const RoleIcon = config.icon;

  const isLoggedIn = !!session?.user;
  const emailMismatch =
    isLoggedIn &&
    invite.email &&
    invite.email !== session?.user?.email;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] space-y-4">
        {/* Logo */}
        <div className="text-center pb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-[22px] font-bold text-[#040B37] tracking-tight">
              CSCN
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E3E8F4] rounded-[20px] overflow-hidden shadow-sm">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#1C4ED1] to-[#0575FF]" />

          <div className="p-8 space-y-6">
            {/* Status indicator */}
            {isUsed && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-[12px]">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-emerald-800">
                    Invite already used
                  </p>
                  <p className="text-[13px] text-emerald-700">
                    This invite link has already been claimed.
                  </p>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <XCircle size={20} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-red-700">
                    Invite expired
                  </p>
                  <p className="text-[13px] text-red-600">
                    This invite link is no longer valid. Ask an admin for a new one.
                  </p>
                </div>
              </div>
            )}

            {/* Role card */}
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-[12px] flex items-center justify-center shrink-0 ${config.bg}`}>
                <RoleIcon size={24} className={config.color} />
              </div>
              <div className="space-y-1">
                <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">
                  You&apos;ve been invited as
                </p>
                <h1 className="text-[26px] font-bold text-[#040B37] tracking-tight leading-tight">
                  {config.label}
                </h1>
                <p className="text-[14px] text-[#4B5563] leading-snug">
                  {config.description}
                </p>
              </div>
            </div>

            {/* Expiry / email info */}
            {isActive && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
                  <Clock size={13} />
                  <span>{formatExpiry(invite.expiresAt)}</span>
                </div>
                {invite.email && (
                  <p className="text-[13px] text-[#9CA3AF]">
                    Restricted to:{" "}
                    <span className="font-mono text-[#4B5563]">{invite.email}</span>
                  </p>
                )}
              </div>
            )}

            {/* CTA section */}
            {isActive && (
              <div className="space-y-3 pt-1">
                {isLoggedIn && !emailMismatch && (
                  <>
                    <p className="text-[13px] text-[#9CA3AF] text-center">
                      Signed in as{" "}
                      <span className="font-semibold text-[#4B5563]">
                        {session?.user?.email}
                      </span>
                    </p>
                    <AcceptButton token={token} />
                  </>
                )}

                {isLoggedIn && emailMismatch && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px]">
                    <p className="text-[13px] text-amber-800 font-medium">
                      This invite is for{" "}
                      <span className="font-mono">{invite.email}</span>, but
                      you&apos;re signed in as{" "}
                      <span className="font-mono">{session?.user?.email}</span>.
                      Sign in with the correct account to continue.
                    </p>
                  </div>
                )}

                {!isLoggedIn && (
                  <>
                    <p className="text-[14px] text-[#9CA3AF] text-center">
                      Sign in or create an account to accept this invite.
                    </p>
                    <Link
                      href={`/signin?callbackUrl=/invite/${token}`}
                      className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[12px] text-[15px] font-semibold transition-all"
                    >
                      <LogIn size={18} />
                      Sign in to accept
                    </Link>
                    <Link
                      href={`/signup?callbackUrl=/invite/${token}`}
                      className="w-full h-[52px] flex items-center justify-center gap-2 bg-white border border-[#E3E8F4] hover:bg-[#F4F6FB] text-[#040B37] rounded-[12px] text-[15px] font-semibold transition-all"
                    >
                      <UserPlus size={18} />
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}

            {(isUsed || isExpired) && (
              <Link
                href="/"
                className="w-full h-[52px] flex items-center justify-center bg-[#F4F6FB] border border-[#E3E8F4] hover:bg-white text-[#040B37] rounded-[12px] text-[15px] font-semibold transition-all"
              >
                Go to homepage
              </Link>
            )}
          </div>
        </div>

        <p className="text-center text-[13px] text-[#9CA3AF]">
          CSCN Learning Platform &mdash; Secure invite system
        </p>
      </div>
    </div>
  );
}
