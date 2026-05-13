import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");

  if (!process.env.SEED_ADMIN_SECRET || secret !== process.env.SEED_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existingAdmin = await db.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return NextResponse.json(
      { error: "An admin account already exists. Use the admin panel to manage roles." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    return NextResponse.json({ error: "Missing required fields: email, password, firstName, lastName" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const admin = await db.user.create({
    data: {
      name: `${body.firstName} ${body.lastName}`,
      email: body.email,
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  return NextResponse.json({
    success: true,
    message: `Admin created: ${admin.name} (${admin.email})`,
  });
}
