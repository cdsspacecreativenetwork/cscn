import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import authConfig from "./auth.config";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  events: {
    async createUser({ user }) {
      // If user is created without an image (e.g. email registration handled elsewhere or provider missing image)
      // we ensure they have a branded one from day one.
      if (!user.image) {
        const { generateTapbackAvatar } = await import("@/lib/avatar");
        await db.user.update({
          where: { id: user.id },
          data: { image: generateTapbackAvatar(user.name || user.email || user.id!) }
        });
      }
    },
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  ...authConfig,
});
