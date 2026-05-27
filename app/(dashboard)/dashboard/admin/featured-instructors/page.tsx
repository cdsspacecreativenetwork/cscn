import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { getFeaturedInstructorAdminData } from "@/data/featured-instructors";
import { FeaturedInstructorPicker } from "@/components/dashboard/admin/FeaturedInstructorPicker";

export default async function FeaturedInstructorsPage() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;

  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return (
      <div className="p-[clamp(16px,2.78vw,48px)]">
        <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-8 text-center">
          <p className="text-[18px] font-bold text-[#040B37]">Unauthorized</p>
          <p className="mt-1 text-[14px] font-medium text-[#9CA3AF]">
            You do not have access to featured instructor management.
          </p>
        </div>
      </div>
    );
  }

  const data = await getFeaturedInstructorAdminData();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 p-[clamp(16px,2.78vw,48px)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/admin/users"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#1C4ED1] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to users
          </Link>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#1C4ED1]/10 px-3 py-1 text-[12px] font-bold text-[#1C4ED1]">
              <Sparkles size={14} />
              Editorial homepage curation
            </div>
            <h1 className="text-[24px] font-bold tracking-tight text-[#040B37] md:text-[32px]">
              Featured Instructors
            </h1>
            <p className="max-w-2xl text-[14px] font-medium leading-6 text-[#9CA3AF]">
              Choose up to four verified instructors for the homepage. Suggestions are ranked automatically, but the final selection remains editorial.
            </p>
          </div>
        </div>
      </div>

      <FeaturedInstructorPicker slots={data.slots} suggestions={data.suggestions} />
    </div>
  );
}
