import { db } from "@/lib/db";
import { generateTapbackAvatar } from "@/lib/avatar";

export type CertificateCommunityMember = {
  id: string;
  name: string;
  image: string;
  role: "USER" | "INSTRUCTOR";
  href: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function getCertificateCommunityMembers(): Promise<CertificateCommunityMember[]> {
  const users = await db.user.findMany({
    where: {
      OR: [
        { role: { in: ["USER", "INSTRUCTOR"] } },
        { instructorProfileEnabled: true },
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
      instructorProfileEnabled: true,
      publicProfileSlug: true,
    },
  });

  return users.map((user) => {
    const name =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.email.split("@")[0] ||
      "CSCN Member";

    const shouldUseInstructorProfile = user.role === "INSTRUCTOR" || user.instructorProfileEnabled;
    const instructorSlug = user.publicProfileSlug || slugify(name) || user.id;

    return {
      id: user.id,
      name,
      image: user.image || generateTapbackAvatar(name || user.id),
      role: shouldUseInstructorProfile ? "INSTRUCTOR" : "USER",
      href: shouldUseInstructorProfile ? `/instructor/${instructorSlug}` : `/student/${user.id}`,
    };
  });
}
