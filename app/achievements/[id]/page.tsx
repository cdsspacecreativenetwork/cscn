import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, ShieldCheck, Share2, Compass, ArrowRight, ExternalLink } from "lucide-react";

// Standard icon map matching seeded icons
const EMOJI_MAP: Record<string, string> = {
  CheckCircle: "🥇",
  BookOpen: "💡",
  Flame: "🔥",
  Zap: "⚡",
  Award: "🎓",
  UserPlus: "👥",
  Sparkles: "✨",
  Trophy: "🏆",
  Globe: "🌐",
};

interface Props {
  params: Promise<{ id: string }>;
}

// ── SEO & Dynamic OpenGraph Meta Tags ────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const userAch = await db.userAchievement.findUnique({
    where: { id },
    include: { user: true, achievement: true },
  });

  if (!userAch) {
    return {
      title: "Credential Not Found | CSCN LMS",
      description: "Verified learning credentials, credentials verification system.",
    };
  }

  const userName = userAch.user.name || "Ecosystem Member";
  const badgeName = userAch.achievement.name;
  const description = `${userName} has successfully completed CSCN curriculum milestones and unlocked the verified '${badgeName}' badge.`;
  
  // Set up the dynamic social og:image endpoint link
  const cardUrl = `/api/achievements/${id}/card`;

  return {
    title: `Verified Achievement: ${badgeName} — Unlocked by ${userName} | CSCN`,
    description,
    openGraph: {
      title: `Verified CSCN Badge: ${badgeName} Earned!`,
      description,
      images: [
        {
          url: cardUrl,
          width: 1200,
          height: 630,
          alt: `${userName} - ${badgeName} Credential`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `Verified CSCN Badge: ${badgeName} Earned!`,
      description,
      images: [cardUrl],
    },
  };
}

export default async function AchievementShowcasePage({ params }: Props) {
  const { id } = await params;

  // Retrieve the user achievement
  const userAch = await db.userAchievement.findUnique({
    where: { id },
    include: {
      user: true,
      achievement: true,
    },
  });

  if (!userAch) {
    notFound();
  }

  const userName = userAch.user.name || "CSCN Learner";
  const userImage = userAch.user.image;
  const badgeName = userAch.achievement.name;
  const badgeDesc = userAch.achievement.description;
  const badgeEmoji = EMOJI_MAP[userAch.achievement.icon] || "🏅";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-jakarta relative overflow-hidden">
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1C4ED1]/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[55%] h-[55%] bg-emerald-500/5 rounded-full filter blur-[150px] pointer-events-none" />

      {/* 1. Brand Navbar */}
      <header className="w-full max-w-[1200px] mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5 z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-3.5 h-7 bg-[#1C4ED1] rounded-[3px] group-hover:scale-105 transition-transform" />
          <span className="text-[20px] font-black tracking-wider text-white">CSCN</span>
        </Link>
        <div className="flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 text-[11px] font-bold text-gray-300 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-emerald-400 mr-1" /> SECURE VERIFICATION
        </div>
      </header>

      {/* 2. Main Credential Presentation Panel */}
      <main className="flex-1 max-w-[1200px] mx-auto px-6 py-12 md:py-20 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 z-10 w-full">
        {/* Left Side: Credential Details */}
        <div className="flex-1 space-y-6 text-left max-w-[550px]">
          <div className="space-y-2">
            <span className="text-[12px] font-extrabold uppercase bg-blue-500/10 border border-blue-500/20 text-[#1C4ED1] px-4 py-1.5 rounded-full tracking-widest inline-block">
              Ecosystem Achievement
            </span>
            <h1 className="text-[34px] md:text-[48px] font-extrabold leading-tight tracking-tight text-white mt-3">
              Congratulations,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                {userName}
              </span>
            </h1>
          </div>

          <p className="text-[16px] md:text-[18px] text-gray-400 leading-relaxed font-medium">
            This certifies that {userName} has successfully completed CSCN LMS curriculum milestones and earned the verified status of **{badgeName}** on our global network.
          </p>

          {/* Verification Audit Roster */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <span className="text-[13px] text-gray-400 font-semibold">Credential Status</span>
              <span className="text-[12px] font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-md border border-emerald-500/15">
                Active & Verified
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-gray-400 font-semibold">Date Unlocked</span>
              <span className="text-[13px] text-white font-bold">
                {userAch.unlockedAt.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Social CTA Links */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3 bg-[#1C4ED1] hover:bg-blue-700 text-white font-extrabold text-[14px] rounded-xl shadow-md transition-all flex items-center gap-2 group"
            >
              Start Learning Free <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/api/achievements/${id}/card`}
              target="_blank"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-[14px] rounded-xl transition-all flex items-center gap-2"
            >
              View Image Source <ExternalLink size={15} />
            </Link>
          </div>
        </div>

        {/* Right Side: Interactive 3D Orbit Badge showcase */}
        <div className="flex-1 flex flex-col items-center justify-center shrink-0">
          <div className="relative w-[320px] h-[320px] md:w-[380px] md:h-[380px] rounded-full border border-white/5 flex items-center justify-center">
            {/* Spinning decorative background orbits */}
            <div className="absolute inset-0 rounded-full border border-dashed border-[#1C4ED1]/20 animate-spin" style={{ animationDuration: "60s" }} />
            <div className="absolute inset-8 rounded-full border border-white/5 animate-spin" style={{ animationDuration: "25s", animationDirection: "reverse" }} />

            {/* Glowing Backdrop Ring */}
            <div className="w-[240px] h-[240px] md:w-[280px] md:h-[280px] rounded-full bg-[#1E293B]/45 border-2 border-[#1C4ED1] flex flex-col items-center justify-center shadow-2xl relative group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1C4ED1]/20 to-emerald-500/10 opacity-30 group-hover:opacity-50 transition-opacity" />
              <span className="text-[100px] md:text-[120px] z-10 transform group-hover:scale-110 transition-transform duration-350 select-none">
                {badgeEmoji}
              </span>
            </div>
          </div>

          <div className="text-center mt-6 space-y-1">
            <h3 className="text-[20px] md:text-[24px] font-extrabold text-amber-400 tracking-wider uppercase">
              {badgeName}
            </h3>
            <p className="text-[13px] md:text-[14px] text-gray-400 max-w-[260px] mx-auto leading-normal">
              {badgeDesc}
            </p>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="w-full text-center py-8 border-t border-white/5 text-[12px] text-gray-500 z-10">
        &copy; {new Date().getFullYear()} CSCN LMS Network. All rights reserved. All ecosystem achievements are cryptographically signed.
      </footer>
    </div>
  );
}
