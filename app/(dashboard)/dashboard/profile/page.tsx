import React from 'react';
import { ProfileBanner } from '@/components/dashboard/profile/ProfileBanner';
import { ProfileStats } from '@/components/dashboard/profile/ProfileStats';
import { ProfileForm } from '@/components/dashboard/profile/ProfileForm';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await currentUser();

  if (!user) {
    return redirect("/auth/login");
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id }
  });

  if (!dbUser) {
    return redirect("/auth/login");
  }

  const roleLabel = 
    dbUser.role === 'USER' ? 'Student' : 
    dbUser.role === 'INSTRUCTOR' ? 'Instructor' : 
    dbUser.role === 'ADMIN' ? 'Admin' : 
    dbUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 
    'Student';

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-[1400px] mx-auto font-jakarta pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight leading-tight">
            Profile
          </h1>
          <p className="text-[#9CA3AF] text-[15px] md:text-[16px] font-medium tracking-tight">
            Manage your personal information and preferences
          </p>
        </div>
        
        {/* The button is controlled by ProfileForm.tsx using vanilla JS to avoid context/portal overhead */}
        <button 
          id="save-profile-btn"
          type="submit"
          form="profile-form"
          className="bg-[#1C4ED1] hover:bg-[#163BB1] text-white px-8 py-3.5 rounded-[8px] text-[15px] md:text-[16px] font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#9CA3AF] disabled:shadow-none"
        >
          Saved
        </button>
      </div>

      {/* Main Profile Card Container */}
      <div className="bg-white border border-[#E3E8F4] rounded-[24px] overflow-hidden shadow-sm flex flex-col">
        {/* Banner Section */}
        <ProfileBanner user={dbUser} />

        {/* User Identity Section - Exactly under the pfp */}
        <div className="pt-[96px] px-10 pb-10 flex flex-col gap-10">
          {/* Name, Role & Bio */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-[20px] md:text-[24px] font-bold text-[#040B37] tracking-tight">
                {dbUser.firstName || dbUser.lastName 
                  ? `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() 
                  : dbUser.name || 'User'}
              </h2>
              <p className="text-[#1C4ED1] text-[14px] font-bold uppercase tracking-wider">
                {roleLabel}
              </p>
            </div>
            <p className="text-[#9CA3AF] text-[15px] md:text-[16px] font-medium max-w-[800px] leading-relaxed">
              {dbUser.bio || "No bio yet."}
            </p>
          </div>

          {/* Stats Bar */}
          <ProfileStats />

          {/* Detailed Form */}
          <ProfileForm user={dbUser} />
        </div>
      </div>
    </div>
  );
}
