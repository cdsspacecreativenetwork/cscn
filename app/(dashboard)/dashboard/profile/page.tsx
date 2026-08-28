import React from 'react';
import { ProfileBanner } from '@/components/dashboard/profile/ProfileBanner';
import { ProfileStats } from '@/components/dashboard/profile/ProfileStats';
import { ProfileForm } from '@/components/dashboard/profile/ProfileForm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getInstructorOnboardingStatusByUserId } from '@/lib/instructor-onboarding';
import { ProfileHeaderActions } from '@/components/dashboard/profile/ProfileHeaderActions';
import { getLocationTimezoneOptions } from '@/lib/location-timezones.server';
import { getStudentPublicProfileEligibility } from '@/lib/profile-eligibility';
import { LearnerPageHeader } from '@/components/dashboard/learner/LearnerPageHeader';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return redirect("/signin");
  }
  if (!user.id) {
    return redirect("/signin");
  }

  const [
    dbUser,
    onboardingStatus,
    enrolledCourses,
    certificateCourses,
    watchSegments,
    publishedCourses,
    achievements,
    ratingAggregate,
    locationTimezoneOptions,
  ] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id }
    }),
    getInstructorOnboardingStatusByUserId(user.id),
    db.enrollment.count({
      where: { userId: user.id },
    }),
    db.enrollment.count({
      where: {
        userId: user.id,
        completedAt: { not: null },
        course: { certificateEnabled: true },
      },
    }),
    db.lessonWatchSegment.aggregate({
      where: { userId: user.id },
      _sum: { secondsWatched: true },
    }),
    db.course.count({
      where: {
        status: "PUBLISHED",
        OR: [
          { instructorId: user.id },
          { instructors: { some: { userId: user.id } } },
        ],
      },
    }),
    db.userAchievement.count({
      where: { userId: user.id },
    }),
    db.courseRating.aggregate({
      where: {
        course: {
          OR: [
            { instructorId: user.id },
            { instructors: { some: { userId: user.id } } },
          ],
        },
      },
      _avg: { rating: true },
    }),
    getLocationTimezoneOptions(),
  ]);

  if (!dbUser) {
    return redirect("/signin");
  }

  const roleLabel = 
    dbUser.role === 'USER' ? 'Student' : 
    dbUser.role === 'INSTRUCTOR' ? 'Instructor' : 
    dbUser.role === 'ADMIN' ? 'Admin' : 
    dbUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 
    'Student';
  const displayName = dbUser.firstName || dbUser.lastName
    ? `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim()
    : dbUser.name || 'User';
  const isInstructorProfile = dbUser.instructorProfileEnabled;
  const studentPublicProfileEligibility = getStudentPublicProfileEligibility(dbUser);
  const publicProfileMissingLabels = isInstructorProfile
    ? onboardingStatus.readiness.items
        .filter((item) => item.id !== "email" && !item.complete)
        .map((item) => item.label)
    : studentPublicProfileEligibility.missingLabels;
  const publicProfileUrl = isInstructorProfile
    ? onboardingStatus.publicProfileUrl
    : studentPublicProfileEligibility.eligible
      ? `/student/${dbUser.id}`
      : null;
  const profileStats = isInstructorProfile
    ? [
        { value: publishedCourses.toLocaleString(), label: "Published Courses" },
        { value: achievements.toLocaleString(), label: "Achievements" },
        {
          value: ratingAggregate._avg.rating
            ? Number(ratingAggregate._avg.rating.toFixed(1)).toString()
            : "New",
          label: "Overall Rating",
        },
      ]
    : [
        { value: enrolledCourses.toLocaleString(), label: "Courses" },
        { value: certificateCourses.toLocaleString(), label: "Certs" },
        { value: `${Math.floor((watchSegments._sum.secondsWatched ?? 0) / 3600).toLocaleString()}h`, label: "Hours" },
      ];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-8 p-4 pb-28 sm:p-6 md:gap-10 md:p-10 md:pb-20">
      {/* Page Header */}
      <LearnerPageHeader
        title="Profile"
        description="Manage your personal information and preferences."
        action={
        <button 
          id="save-profile-btn"
          type="submit"
          form="profile-form"
          hidden
          className="min-h-11 cursor-pointer rounded-[8px] bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Saved
        </button>}
      />

      {/* Main Profile Card Container */}
      <div className="bg-white border border-[#E3E8F4] rounded-[24px] overflow-hidden shadow-sm flex flex-col">
        {/* Banner Section */}
        <ProfileBanner user={dbUser} />

        {/* User Identity Section - Exactly under the pfp */}
        <div className="flex flex-col gap-8 px-5 pb-8 pt-[76px] sm:px-10 sm:pb-10 sm:pt-[68px] md:gap-10">
          {/* Name, Role & Bio */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold tracking-tight text-navy">
                  {displayName}
                </h2>
                <p className="text-sm font-medium text-primary">
                  {roleLabel}
                </p>
              </div>
              <ProfileHeaderActions
                role={dbUser.role}
                instructorProfileEnabled={dbUser.instructorProfileEnabled}
                publicProfileUrl={publicProfileUrl}
                publicProfileMissingLabels={publicProfileMissingLabels}
                verificationStatus={onboardingStatus.verificationStatus}
                canRequestVerification={onboardingStatus.canRequestVerification}
              />
            </div>
            <p className="max-w-[800px] text-sm font-normal leading-6 text-text-body">
              {dbUser.bio || "No bio yet."}
            </p>
          </div>

          {/* Stats Bar */}
          <ProfileStats items={profileStats} />

          {/* Detailed Form */}
          <ProfileForm user={dbUser} locationTimezoneOptions={locationTimezoneOptions} />
        </div>
      </div>
    </div>
  );
}
