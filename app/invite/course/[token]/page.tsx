import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, GraduationCap, Clock, XCircle, CheckCircle2, LogIn, UserPlus } from 'lucide-react';
import { auth } from '@/auth';
import { getCourseInviteByToken } from '@/data/instructor';
import { CourseAcceptButton } from './CourseAcceptButton';

const ROLE_CONFIG = {
  CO_INSTRUCTOR: {
    label: 'Co-Instructor',
    description: 'Edit course content, manage curriculum, and support students.',
    icon: BookOpen,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  TEACHING_ASSISTANT: {
    label: 'Teaching Assistant',
    description: 'View course content and assist students with their progress.',
    icon: GraduationCap,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
} as Record<string, { label: string; description: string; icon: React.ElementType; color: string; bg: string }>;

function formatExpiry(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Expires in less than 1 hour';
  if (hours < 24) return `Expires in ${hours} hour${hours !== 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Expires in ${days} day${days !== 1 ? 's' : ''}`;
}

export default async function CourseInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [invite, session] = await Promise.all([getCourseInviteByToken(token), auth()]);

  if (!invite) notFound();

  const isUsed = !!invite.usedAt;
  const isExpired = !isUsed && invite.expiresAt < new Date();
  const isActive = !isUsed && !isExpired;

  const config = ROLE_CONFIG[invite.role] ?? ROLE_CONFIG.CO_INSTRUCTOR;
  const RoleIcon = config.icon;

  const isLoggedIn = !!session?.user;
  const emailMismatch = isLoggedIn && invite.email && invite.email !== session?.user?.email;

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] space-y-4">
        {/* Logo */}
        <div className="text-center pb-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-[22px] font-bold text-[#040B37] tracking-tight">CSCN</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#E3E8F4] rounded-[20px] overflow-hidden shadow-sm">
          <div className="h-1.5 bg-gradient-to-r from-[#1C4ED1] to-[#0575FF]" />

          <div className="p-8 space-y-6">
            {/* Status banners */}
            {isUsed && (
              <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-[12px]">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-emerald-800">Invite already used</p>
                  <p className="text-[13px] text-emerald-700">This invite link has already been claimed.</p>
                </div>
              </div>
            )}

            {isExpired && (
              <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-[12px]">
                <XCircle size={20} className="text-red-500 shrink-0" />
                <div>
                  <p className="text-[14px] font-semibold text-red-700">Invite expired</p>
                  <p className="text-[13px] text-red-600">This invite is no longer valid. Ask the course owner for a new one.</p>
                </div>
              </div>
            )}

            {/* Course info */}
            <div className="flex items-center gap-3 p-4 bg-background border border-stroke rounded-[12px]">
              {invite.course.thumbnail ? (
                <div className="relative w-14 h-10 rounded-[8px] overflow-hidden shrink-0">
                  <Image src={invite.course.thumbnail} alt="" fill className="object-cover" />
                </div>
              ) : (
                <div className="w-14 h-10 rounded-[8px] bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-primary" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#9CA3AF] uppercase tracking-wider">Course</p>
                <p className="text-[14px] font-semibold text-navy truncate">{invite.course.title}</p>
              </div>
            </div>

            {/* Role */}
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
                <p className="text-[14px] text-[#4B5563] leading-snug">{config.description}</p>
              </div>
            </div>

            {/* Expiry / email */}
            {isActive && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[13px] text-[#9CA3AF]">
                  <Clock size={13} />
                  <span>{formatExpiry(invite.expiresAt)}</span>
                </div>
                {invite.email && (
                  <p className="text-[13px] text-[#9CA3AF]">
                    Restricted to:{' '}
                    <span className="font-mono text-[#4B5563]">{invite.email}</span>
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            {isActive && (
              <div className="space-y-3 pt-1">
                {isLoggedIn && !emailMismatch && (
                  <>
                    <p className="text-[13px] text-[#9CA3AF] text-center">
                      Signed in as{' '}
                      <span className="font-semibold text-[#4B5563]">{session?.user?.email}</span>
                    </p>
                    <CourseAcceptButton token={token} />
                  </>
                )}

                {isLoggedIn && emailMismatch && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-[12px]">
                    <p className="text-[13px] text-amber-800 font-medium">
                      This invite is for{' '}
                      <span className="font-mono">{invite.email}</span>, but you&apos;re signed in as{' '}
                      <span className="font-mono">{session?.user?.email}</span>. Sign in with the correct account to continue.
                    </p>
                  </div>
                )}

                {!isLoggedIn && (
                  <>
                    <p className="text-[14px] text-[#9CA3AF] text-center">
                      Sign in or create an account to accept this invite.
                    </p>
                    <Link
                      href={`/signin?callbackUrl=/invite/course/${token}`}
                      className="w-full h-[52px] flex items-center justify-center gap-2 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[12px] text-[15px] font-semibold transition-all"
                    >
                      <LogIn size={18} />
                      Sign in to accept
                    </Link>
                    <Link
                      href={`/signup?callbackUrl=/invite/course/${token}`}
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
