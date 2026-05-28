import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import authConfig from "./auth.config";
import { LoginSchema } from "@/schemas";
import { getUserByEmail, getUserById } from "@/data/user";
import { ADMIN_PERMISSION_KEYS } from "@/lib/admin-permissions";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.type === "credentials") return true;

      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        
        const sessionToken = 
          cookieStore.get("authjs.session-token")?.value ||
          cookieStore.get("__Secure-authjs.session-token")?.value ||
          cookieStore.get("next-auth.session-token")?.value ||
          cookieStore.get("__Secure-next-auth.session-token")?.value;

        if (sessionToken) {
          const { decode } = await import("next-auth/jwt");
          let cookieName = "authjs.session-token";
          if (cookieStore.get("__Secure-authjs.session-token")) cookieName = "__Secure-authjs.session-token";
          else if (cookieStore.get("next-auth.session-token")) cookieName = "next-auth.session-token";
          else if (cookieStore.get("__Secure-next-auth.session-token")) cookieName = "__Secure-next-auth.session-token";

          const decoded = await decode({
            token: sessionToken,
            secret: process.env.AUTH_SECRET || "",
            salt: cookieName,
          });

          if (decoded && decoded.email) {
            const loggedInEmail = decoded.email.toLowerCase();
            const oauthEmail = profile?.email?.toLowerCase();
            
            if (oauthEmail && loggedInEmail !== oauthEmail) {
              return `/dashboard/settings?error=OAuthEmailMismatch`;
            }
          }
        }
      } catch (error) {
        console.error("Error checking OAuth email mismatch:", error);
      }

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
        for (const permission of ADMIN_PERMISSION_KEYS) {
          // @ts-ignore - permissions are added to the session user through module augmentation.
          session.user[permission] = Boolean(token[permission]);
        }
        // @ts-ignore
        session.user.emailVerified = token.emailVerified;
      }

      return session;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // @ts-ignore
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }

      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

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
        for (const permission of ADMIN_PERMISSION_KEYS) {
          // @ts-ignore - permission keys are selected from the Prisma user record.
          token[permission] = existingUser[permission] ?? false;
        }
      }

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (!user.image) {
        const { generateTapbackAvatar } = await import("@/lib/avatar");
        await db.user.update({
          where: { id: user.id },
          data: { image: generateTapbackAvatar(user.name || user.email || user.id!) },
        });
      }
    },
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
});
