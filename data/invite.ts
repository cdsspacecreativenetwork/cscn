import { db } from "@/lib/db";

export const getInviteByToken = async (token: string) => {
  try {
    return await db.inviteToken.findUnique({ where: { token } });
  } catch {
    return null;
  }
};

export const getAllInvites = async () => {
  try {
    return await db.inviteToken.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
};
