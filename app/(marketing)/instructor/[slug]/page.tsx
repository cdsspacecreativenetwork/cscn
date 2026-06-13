import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck, Globe } from "lucide-react";
import {
  FaXTwitter,
  FaLinkedin,
  FaInstagram,
  FaTelegram,
  FaGithub,
  FaBehance,
  FaDribbble,
  FaYoutube,
} from "react-icons/fa6";

import { generateTapbackAvatar } from "@/lib/avatar";
import { db } from "@/lib/db";
import { buildMentorBookingSlots } from "@/lib/mentor-booking-slots";
import { getInstructorPublicProfileEligibility } from "@/lib/profile-eligibility";
import { MentorProfileBookingCard } from "@/components/marketing/MentorProfileBookingCard";

interface Socials {
  linkedin?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
}

const socialButtonClass =
  "flex h-10 w-10 items-center justify-center rounded-[10px] border border-stroke-ii bg-white text-text-title transition-all duration-200 hover:border-primary hover:text-primary active:scale-95 hover:shadow-sm";

function formatPrice(price: unknown, currency?: string | null) {
  const numericPrice = Number(price ?? 0);
  if (!numericPrice) return "Free";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

function formatCourseMeta(lessons: number, minutes: number) {
  if (minutes >= 60) {
    const hours = Math.round((minutes / 60) * 10) / 10;
    return `${lessons} lessons / ${hours} hours`;
  }

  return `${lessons} lessons / ${minutes || 0} minutes`;
}

export default async function InstructorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ bookingError?: string }>;
}) {
  const { slug } = await params;
  const query = searchParams ? await searchParams : {};
  const formattedName = slug.replace(/-/g, " ");

  const instructor = await db.user.findFirst({
    where: {
      instructorProfileEnabled: true,
      OR: [
        { id: slug },
        { publicProfileSlug: slug },
        { email: { startsWith: slug.replace(/-/g, ".") } },
        { name: { mode: "insensitive", equals: formattedName } },
      ],
    },
    include: {
      taughtCourses: {
        where: { status: "PUBLISHED" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          price: true,
          baseCurrency: true,
          modules: {
            select: {
              _count: { select: { lessons: true } },
              lessons: { select: { duration: true } },
            },
          },
        },
      },
      mentorAvailabilities: {
        where: { status: "ACTIVE" },
        orderBy: [{ type: "asc" }, { weekday: "asc" }, { date: "asc" }, { startTime: "asc" }],
        select: {
          id: true,
          type: true,
          weekday: true,
          date: true,
          startTime: true,
          endTime: true,
          timezone: true,
          sessionDuration: true,
          bufferMinutes: true,
          maxBookings: true,
          bookings: {
            where: { status: { in: ["PENDING", "CONFIRMED"] } },
            select: { startsAt: true, status: true },
          },
        },
      },
    },
  });

  if (!instructor) notFound();
  const eligibility = getInstructorPublicProfileEligibility(instructor);
  if (!eligibility.eligible && instructor.publicProfileStatus !== "PUBLIC") notFound();

  const instructorName =
    instructor.name ||
    [instructor.firstName, instructor.lastName].filter(Boolean).join(" ").trim() ||
    "CSCN Instructor";
  const instructorImage = instructor.image ?? generateTapbackAvatar(instructorName);
  const totalStudents = await db.enrollment.count({
    where: { course: { instructorId: instructor.id } },
  });
  const legacySocials = (instructor.socials as Socials | null) ?? {};
  const isVerified = instructor.instructorVerificationStatus === "VERIFIED";
  const mentorshipTopics = Array.isArray(instructor.mentorshipTopics)
    ? instructor.mentorshipTopics.filter((topic): topic is string => typeof topic === "string")
    : [];
  const mentorshipIsPublic =
    instructor.mentorshipEligible &&
    instructor.mentorshipEnabled &&
    instructor.instructorVerificationStatus === "VERIFIED" &&
    instructor.publicProfileStatus === "PUBLIC";
  const mentorshipPriceLabel = instructor.mentorshipFree
    ? "Free session"
    : instructor.mentorshipPrice
      ? `${instructor.mentorshipCurrency} ${instructor.mentorshipPrice.toString()}`
      : "Paid session";
  const mentorshipSlots = mentorshipIsPublic
    ? buildMentorBookingSlots(instructor.mentorAvailabilities, 12)
    : [];

  const socialLinks = [
    { href: instructor.twitterUrl ?? legacySocials.twitter, label: "X", icon: FaXTwitter },
    { href: instructor.linkedinUrl ?? legacySocials.linkedin, label: "LinkedIn", icon: FaLinkedin },
    { href: instructor.instagramUrl, label: "Instagram", icon: FaInstagram },
    { href: instructor.telegramUrl, label: "Telegram", icon: FaTelegram },
    { href: instructor.githubUrl, label: "GitHub", icon: FaGithub },
    { href: instructor.behanceUrl, label: "Behance", icon: FaBehance },
    { href: instructor.dribbbleUrl, label: "Dribbble", icon: FaDribbble },
    { href: instructor.youtubeUrl ?? legacySocials.youtube, label: "YouTube", icon: FaYoutube },
    { href: instructor.websiteUrl ?? instructor.portfolioUrl ?? legacySocials.website, label: "Website", icon: Globe },
  ].filter((item) => !!item.href);

  const courseCards = instructor.taughtCourses.map((course) => {
    const lessons = course.modules.reduce((sum, module) => sum + module._count.lessons, 0);
    const minutes = course.modules
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + (lesson.duration ?? 0), 0);

    return {
      ...course,
      lessons,
      minutes,
      meta: formatCourseMeta(lessons, minutes),
      priceLabel: formatPrice(course.price, course.baseCurrency),
      image: course.thumbnail || "/assets/default-course.jpg",
    };
  });

  // Dynamic summary of total lessons and duration
  const totalLessons = courseCards.reduce((sum, course) => sum + course.lessons, 0);
  const totalMinutes = courseCards.reduce((sum, course) => sum + course.minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const hasCourses = courseCards.length > 0;

  return (
    <div className="min-h-screen bg-background pt-[112px]">
      <div className="mx-auto w-full max-w-[88rem] px-4 lg:px-6 pb-24">
        {/* Back Button: Capsule Styled to 48px Height */}
        <Link
          href="/mentorship"
          className="inline-flex p-5 px-6 items-center gap-2 rounded-full border border-stroke-ii bg-transparent text-[16px] font-medium text-text-body transition-all duration-200 hover:border-primary hover:text-primary active:scale-95 shadow-[0px_1px_2px_rgba(16,24,40,0.05)]"
        >
          <ArrowLeft size={20} strokeWidth={1.75} />
          Back
        </Link>

        {/* Outer Page Layout Grid: Exactly 290px Sidebar Split */}
        <section className="mt-8 grid gap-6 lg:grid-cols-[290px_1fr] lg:gap-[24px]">
          {/* Left Sidebar Card: Aligned to Figma Specs */}
          <aside className="h-fit overflow-hidden rounded-[16px] border border-stroke bg-white p-2 shadow-[0px_1px_3px_rgba(16,24,40,0.05)]">
            {/* Avatar Container: Exactly 280px Height and 10px Radius */}
            <div className="relative h-[420px] w-full overflow-hidden rounded-[10px] bg-[#EAF2FF] sm:h-[520px] lg:h-[280px]">
              <Image
                src={instructorImage}
                alt={instructorName}
                fill
                priority
                className="object-cover object-[center_20%]"
                sizes="280px"
                unoptimized={instructorImage.includes("tapback.co") || instructorImage.includes("dicebear.com")}
              />
            </div>

            {/* Profile Info: Aligned to Figma Typography */}
            <div className="px-3 pt-5 pb-[18px] text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-[24px] font-semibold tracking-tight text-text-title leading-snug">{instructorName}</h1>
                {isVerified && <BadgeCheck size={20} className="text-primary shrink-0" />}
              </div>
              <p className="mt-2 text-[14px] font-medium text-text-body leading-normal">
                {instructor.headline ?? "CSCN Instructor"}
              </p>
            </div>

            {/* Dashed Separator */}
            <hr className="border-t border-dashed border-stroke mx-2" />

            {/* Stats Block: Aligned Side-by-Side */}
            <div className="grid grid-cols-2 py-[18px] text-center">
              <div className="flex flex-col items-center justify-center">
                <p className="text-[18px] font-semibold text-text-title leading-none">{courseCards.length}</p>
                <p className="mt-2 text-[14px] font-medium text-text-body leading-none">Courses</p>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-stroke border-dashed">
                <p className="text-[18px] font-semibold text-text-title leading-none">{totalStudents.toLocaleString()}</p>
                <p className="mt-2 text-[14px] font-medium text-text-body leading-none">Students</p>
              </div>
            </div>

            {/* Dashed Separator */}
            <hr className="border-t border-dashed border-stroke mx-2" />

            {/* Social Links Block */}
            <div className="flex flex-wrap justify-center gap-3 px-3 py-4">
              {socialLinks.length > 0 ? (
                socialLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={label} href={href!} target="_blank" rel="noreferrer" className={socialButtonClass} aria-label={label}>
                    <Icon size={18} />
                  </Link>
                ))
              ) : (
                <p className="text-center text-[13px] font-medium text-text-mute py-1">No social links added yet.</p>
              )}
            </div>
          </aside>

          {/* Right Panel: Aligned Bio & About Me */}
          <section className="flex flex-col gap-5 pt-1 lg:pl-6">
            {/* Header: Title and dynamically aggregated lesson count */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-stroke pb-4">
              <h2 className="text-[20px] font-semibold tracking-tight text-text-title">About Me</h2>
              {hasCourses && (
                <span className="text-[16px] font-semibold text-text-title">
                  {totalLessons} Lessons ({totalHours}h)
                </span>
              )}
            </div>

            {/* Biography Text: Legible Inter Medium 16px */}
            <div className="max-w-[965px] whitespace-pre-line text-[16px] font-medium leading-[1.65] text-text-body">
              {instructor.bio ||
                "This instructor is preparing their public biography. Their courses, expertise, and teaching style will appear here once they update their profile."}
            </div>

            {/* Verification Badge */}
            <div className="mt-2">
              {isVerified ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-[13px] font-semibold text-emerald-700">
                  <BadgeCheck size={16} />
                  Verified instructor
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3.5 py-1.5 text-[13px] font-semibold text-primary">
                  Public profile
                </div>
              )}
            </div>

            {mentorshipIsPublic && (
              <>
              {query.bookingError && (
                <div className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-[14px] font-semibold text-red-700">
                  {query.bookingError}
                </div>
              )}
              <MentorProfileBookingCard
                mentor={{
                  id: instructor.id,
                  name: instructorName,
                  role: instructor.headline ?? "CSCN Instructor",
                  image: instructorImage,
                  profileUrl: `/instructor/${slug}`,
                  priceLabel: mentorshipPriceLabel,
                  intro: instructor.mentorshipBio,
                  instructions: instructor.mentorshipInstructions,
                  topics: mentorshipTopics,
                  availability: instructor.mentorAvailabilities,
                  slots: mentorshipSlots,
                }}
              />
              </>
            )}
          </section>
        </section>

        {/* All Courses Section: exact spacing and heading styles */}
        <section className="mt-24 lg:mt-32">
          <h2 className="text-[32px] font-semibold tracking-tight text-text-title">Browse courses by {instructorName}</h2>

          {hasCourses ? (
            <div className="mt-8 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {courseCards.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[16px] border border-stroke bg-white p-2 shadow-[0px_1px_3px_rgba(16,24,40,0.05)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0px_12px_24px_-4px_rgba(28,78,209,0.08),0px_4px_8px_-2px_rgba(28,78,209,0.04)]"
                >
                  {/* Thumbnail Container: exactly 216px height */}
                  <div className="relative h-[216px] w-full overflow-hidden rounded-[10px] bg-background">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-103"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </div>

                  {/* Text Details Area: exactly 121px space and styling */}
                  <div className="flex flex-1 flex-col justify-between px-2 pt-4 pb-2">
                    <div>
                      {/* Meta Information: Inter Medium 14px */}
                      <p className="text-[14px] font-medium text-text-body">{course.meta}</p>
                      {/* Title: Inter SemiBold 18px */}
                      <h3 className="mt-3 text-[18px] font-semibold leading-[1.3] tracking-tight text-text-title transition-colors group-hover:text-primary line-clamp-2 min-h-[46px]">
                        {course.title}
                      </h3>
                    </div>

                    {/* Footer divider and info */}
                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-stroke pt-3.5">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-background border border-stroke">
                          <Image
                            src={instructorImage}
                            alt={instructorName}
                            fill
                            className="object-cover"
                            sizes="24px"
                            unoptimized={instructorImage.includes("tapback.co") || instructorImage.includes("dicebear.com")}
                          />
                        </span>
                        {/* Instructor Name: Inter Medium 14px */}
                        <span className="truncate text-[14px] font-medium text-text-body">{instructorName}</span>
                      </div>
                      {/* Price: Inter SemiBold 18px */}
                      <span className="shrink-0 text-[18px] font-semibold text-text-title">{course.priceLabel}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-[18px] border border-dashed border-stroke-ii bg-white px-6 py-12 text-center">
              <h3 className="text-[20px] font-semibold text-text-title">No published courses yet</h3>
              <p className="mt-2 text-[14px] font-medium text-text-body">
                This instructor is still preparing their course catalog.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
