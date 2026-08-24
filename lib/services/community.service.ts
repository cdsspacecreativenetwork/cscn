import { db } from "@/lib/db";

const authorSelect = { id: true, name: true, image: true, headline: true, publicProfileSlug: true } as const;

export async function getCommunityLanding(userId?: string) {
  const spaces = await db.communitySpace.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { visibility: "PUBLIC" },
        ...(userId
          ? [{ memberships: { some: { userId, status: "ACTIVE" as const } } }]
          : []),
      ],
    },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
    select: {
      id: true, slug: true, title: true, description: true, kind: true,
      program: { select: { title: true } }, cohort: { select: { title: true } },
      _count: { select: { memberships: { where: { status: "ACTIVE" } }, posts: { where: { status: "PUBLISHED" } } } },
      memberships: { where: { userId: userId ?? "", status: "ACTIVE" }, select: { id: true }, take: 1 },
      posts: { where: { status: "PUBLISHED", parentId: null }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 2, select: { id: true, title: true, body: true, createdAt: true, author: { select: authorSelect }, _count: { select: { replies: { where: { status: "PUBLISHED" } } } } } },
    },
  });
  return spaces.map((space) => ({ ...space, joined: space.memberships.length > 0, memberships: undefined }));
}

export async function getCommunitySpace(slug: string, userId?: string) {
  const space = await db.communitySpace.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true, slug: true, title: true, description: true, kind: true, visibility: true, guidelines: true,
      program: { select: { title: true } }, cohort: { select: { id: true, title: true, slug: true } },
      memberships: { where: { userId: userId ?? "", status: "ACTIVE" }, select: { id: true, role: true }, take: 1 },
      _count: { select: { memberships: { where: { status: "ACTIVE" } }, posts: { where: { status: "PUBLISHED", parentId: null } } } },
      posts: {
        where: { status: "PUBLISHED", parentId: null }, orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }], take: 30,
        select: { id: true, title: true, body: true, isPinned: true, createdAt: true, author: { select: authorSelect }, replies: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "asc" }, take: 12, select: { id: true, body: true, createdAt: true, author: { select: authorSelect } } } },
      },
    },
  });
  if (!space) return null;
  const membership = space.memberships[0] ?? null;
  if (space.visibility === "MEMBERS_ONLY" && !membership) return { ...space, posts: [], membership, restricted: true as const };
  return { ...space, membership, restricted: false as const };
}

export async function canJoinCommunitySpace(spaceId: string, userId: string) {
  const space = await db.communitySpace.findFirst({ where: { id: spaceId, status: "PUBLISHED" }, select: { id: true, slug: true, title: true, visibility: true, cohortId: true } });
  if (!space) return { success: false as const, error: "Community space not found." };
  if (space.cohortId) {
    const membership = await db.cohortMembership.findFirst({ where: { cohortId: space.cohortId, userId, status: { in: ["ACTIVE", "COMPLETED"] } }, select: { id: true } });
    if (!membership) return { success: false as const, error: "This room is available only to members of its cohort." };
  } else if (space.visibility === "MEMBERS_ONLY") {
    return { success: false as const, error: "This community space requires an invitation." };
  }
  return { success: true as const, space };
}
