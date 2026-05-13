"use server";

import bcrypt from "bcryptjs";
import * as z from "zod";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { SetupAdminSchema } from "@/schemas";
import { adminExists } from "@/data/user";

export const createFirstAdmin = async (
  values: z.infer<typeof SetupAdminSchema>
) => {
  const validated = SetupAdminSchema.safeParse(values);
  if (!validated.success) return { error: "Invalid fields" };

  const { email, password, firstName, lastName, setupSecret } = validated.data;

  if (process.env.SETUP_SECRET && setupSecret !== process.env.SETUP_SECRET) {
    return { error: "Invalid setup secret" };
  }

  const alreadyExists = await adminExists();
  if (alreadyExists) {
    return { error: "An admin account already exists. Please sign in." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  await signIn("credentials", {
    email,
    password,
    redirectTo: "/dashboard",
  });
};
