import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsedDatabaseUrl = new URL(databaseUrl);
const isLocalDatabase = ["localhost", "127.0.0.1"].includes(parsedDatabaseUrl.hostname);
const isQaDatabase = parsedDatabaseUrl.pathname === "/cscn_dev";

if (process.env.ALLOW_QA_SEED !== "true" || !isLocalDatabase || !isQaDatabase) {
  throw new Error("QA fixtures may only be loaded into the local cscn_dev database.");
}

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

async function upsertQaCourse(input: {
  slug: string;
  title: string;
  price: number;
  instructorId: string;
  categoryId: string;
}) {
  const course = await db.course.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      description: "Local review fixture for validating CSCN enrollment access. This record is never used outside the local development database.",
      shortDesc: "Local-only enrollment security review fixture.",
      price: input.price,
      baseCurrency: "NGN",
      status: "PUBLISHED",
      difficulty: "BEGINNER",
      instructorId: input.instructorId,
      categoryId: input.categoryId,
      thumbnail: "/assets/courses/Frame 2147228498-1.png",
    },
    update: {
      title: input.title,
      price: input.price,
      status: "PUBLISHED",
      instructorId: input.instructorId,
      categoryId: input.categoryId,
      thumbnail: "/assets/courses/Frame 2147228498-1.png",
    },
  });

  let courseModule = await db.module.findFirst({
    where: { courseId: course.id, position: 1 },
  });
  courseModule ??= await db.module.create({
    data: {
      courseId: course.id,
      title: "Local access review",
      position: 1,
      isPublished: true,
    },
  });

  const lesson = await db.lesson.findFirst({
    where: { moduleId: courseModule.id, position: 1 },
  });
  if (!lesson) {
    await db.lesson.create({
      data: {
        moduleId: courseModule.id,
        title: "Enrollment access checkpoint",
        overview: "This local-only lesson verifies that the learner can reach the player only after valid enrollment.",
        position: 1,
        contentType: "ARTICLE",
        bodyContent: "<p>Local QA fixture. No production learning content is represented here.</p>",
        isPublished: true,
        isPreview: false,
      },
    });
  }
}

async function main() {
  const password = await bcrypt.hash("LocalReviewOnly!2026", 12);
  const instructor = await db.user.upsert({
    where: { email: "instructor@local.cscn.test" },
    create: {
      email: "instructor@local.cscn.test",
      name: "Local QA Instructor",
      password,
      emailVerified: new Date(),
      role: "INSTRUCTOR",
    },
    update: { password, emailVerified: new Date(), role: "INSTRUCTOR" },
  });

  const learner = await db.user.upsert({
    where: { email: "learner@local.cscn.test" },
    create: {
      email: "learner@local.cscn.test",
      name: "Local QA Learner",
      password,
      emailVerified: new Date(),
      role: "USER",
    },
    update: { password, emailVerified: new Date(), role: "USER" },
  });

  await db.learnerInterestProfile.upsert({
    where: { userId: learner.id },
    create: {
      userId: learner.id,
      interestAreas: ["Frontend Development"],
      skillLevel: "Beginner",
      primaryGoal: "Improve current skills",
      learningStyle: ["Projects"],
      onboardingCompletedAt: new Date(),
    },
    update: { onboardingCompletedAt: new Date() },
  });

  const category = await db.category.upsert({
    where: { slug: "local-qa" },
    create: { name: "Local QA", slug: "local-qa" },
    update: { name: "Local QA" },
  });

  await upsertQaCourse({
    slug: "qa-free-course",
    title: "[QA] Free course access",
    price: 0,
    instructorId: instructor.id,
    categoryId: category.id,
  });
  await upsertQaCourse({
    slug: "qa-paid-course",
    title: "[QA] Paid course access",
    price: 25000,
    instructorId: instructor.id,
    categoryId: category.id,
  });

  console.log("Local QA fixtures are ready.");
  console.log("Learner: learner@local.cscn.test / LocalReviewOnly!2026");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
