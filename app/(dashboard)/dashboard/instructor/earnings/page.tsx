import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getInstructorEarningsDetail } from "@/data/admin-billing";
import { shouldRedirectInstructorToOnboarding } from "@/lib/instructor-onboarding";
import { InstructorEarningsPageClient } from "@/components/dashboard/instructor/InstructorEarningsPageClient";

export default async function InstructorEarningsPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== "INSTRUCTOR" && role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/dashboard");
  }
  if (role === "INSTRUCTOR" && await shouldRedirectInstructorToOnboarding(session.user.id)) {
    redirect("/dashboard/profile?setup=instructor");
  }

  const data = await getInstructorEarningsDetail(session.user.id);
  return <InstructorEarningsPageClient data={JSON.parse(JSON.stringify(data))} />;
}
