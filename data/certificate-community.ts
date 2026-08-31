import { db } from "@/lib/db";
import { generateTapbackAvatar } from "@/lib/avatar";

export type CertificateCommunityMember = {
  id: string;
  name: string;
  image: string;
  profileUrl: string | null;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getCertificateCommunityMembers(): Promise<CertificateCommunityMember[]> {
  const users = await db.user.findMany({
    where: {
      OR: [
        { role: { in: ["USER", "INSTRUCTOR"] } },
        { instructorProfile: { isEnabled: true } },
      ],
    },
    orderBy: [{ image: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      image: true,
      role: true,
      profile: { select: { publicProfileSlug: true } },
      instructorProfile: { select: { isEnabled: true } },
    },
  });

  return users.map((user) => {
    const name =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email.split("@")[0] ||
      "CSCN Member";

    const hasInstructorProfile = user.instructorProfile?.isEnabled ?? false;
    const shouldUseInstructorProfile = user.role === "INSTRUCTOR" || hasInstructorProfile;
    const instructorSlug = user.profile?.publicProfileSlug || slugify(name) || user.id;

    return {
      id: user.id,
      name,
      image: user.image || generateTapbackAvatar(name || user.id),
      profileUrl: shouldUseInstructorProfile ? `/instructor/${instructorSlug}` : null,
    };
  });
}
