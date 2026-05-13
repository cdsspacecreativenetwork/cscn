import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { LoginSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          image: profile.picture,
        };
      }
    }),
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          email: profile.email,
          image: profile.picture,
        };
      }
    }),
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          
          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(
            password,
            user.password,
          );

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.type === "credentials") return true;
      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (session.user) {
        // @ts-ignore
        session.user.role = token.role;
        session.user.name = token.name;
        session.user.email = token.email as string;
        session.user.image = token.picture;
        // @ts-ignore
        session.user.canManageUsers = token.canManageUsers ?? false;
        // @ts-ignore
        session.user.canManageCourses = token.canManageCourses ?? false;
        // @ts-ignore
        session.user.canManageBilling = token.canManageBilling ?? false;
        // @ts-ignore
        session.user.canViewAnalytics = token.canViewAnalytics ?? false;
        // @ts-ignore
        session.user.emailVerified = token.emailVerified;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      // 1. Initial sign-in: capture data from the user object returned by authorize
      if (user) {
        // @ts-ignore
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }

      // 2. Client-side update(): triggered manually when session data changes
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      // 3. Regular refresh: sync with DB so revoked roles take effect immediately
      if (token.sub) {
        const existingUser = await getUserById(token.sub);
        if (!existingUser) return token;

        token.name = existingUser.name;
        token.email = existingUser.email;
        // @ts-ignore
        token.role = existingUser.role;
        token.picture = existingUser.image;
        // @ts-ignore
        token.emailVerified = existingUser.emailVerified;
        // @ts-ignore
        token.canManageUsers = existingUser.canManageUsers ?? false;
        // @ts-ignore
        token.canManageCourses = existingUser.canManageCourses ?? false;
        // @ts-ignore
        token.canManageBilling = existingUser.canManageBilling ?? false;
        // @ts-ignore
        token.canViewAnalytics = existingUser.canViewAnalytics ?? false;
      }

      return token;
    },
  },
  pages: {
    signIn: "/signin",
    error: "/auth/error",
  },
} satisfies NextAuthConfig;
