import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { createHash } from "node:crypto";

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
  shortDesc?: string;
}) {
  const course = await db.course.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      title: input.title,
      description: "Local review fixture for validating CSCN enrollment access. This record is never used outside the local development database.",
      shortDesc: input.shortDesc ?? "Local-only enrollment security review fixture.",
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
      shortDesc: input.shortDesc ?? "Local-only enrollment security review fixture.",
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

  return course;
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

  const admin = await db.user.upsert({
    where: { email: "admin@local.cscn.test" },
    create: {
      email: "admin@local.cscn.test",
      name: "Local QA Admissions Admin",
      password,
      emailVerified: new Date(),
      role: "SUPER_ADMIN",
    },
    update: { password, emailVerified: new Date(), role: "SUPER_ADMIN" },
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

  const cohortCourses = await Promise.all([
    upsertQaCourse({
      slug: "preview-product-design-studio",
      title: "[Preview] Product design studio",
      price: 0,
      instructorId: instructor.id,
      categoryId: category.id,
      shortDesc: "A local preview course used to review the cohort admissions journey.",
    }),
    upsertQaCourse({
      slug: "preview-ai-workflow-builder",
      title: "[Preview] AI workflow builder",
      price: 0,
      instructorId: instructor.id,
      categoryId: category.id,
      shortDesc: "A local preview course used to review the cohort admissions journey.",
    }),
    upsertQaCourse({
      slug: "preview-frontend-product-engineering",
      title: "[Preview] Frontend product engineering",
      price: 0,
      instructorId: instructor.id,
      categoryId: category.id,
      shortDesc: "A local preview course used to review the cohort admissions journey.",
    }),
  ]);

  const school = await db.school.upsert({
    where: { slug: "preview-digital-practice" },
    create: {
      name: "[Preview] School of Digital Practice",
      slug: "preview-digital-practice",
      description: "Local-only school used to review CSCN program and cohort interfaces.",
      status: "PUBLISHED",
      featuredOrder: 1,
    },
    update: { status: "PUBLISHED", featuredOrder: 1 },
  });

  const previewPrograms = [
    {
      slug: "preview-product-design-launchpad",
      title: "[Preview] Product design launchpad",
      shortDescription: "Turn a product problem into a tested interface and a portfolio-ready case study.",
      description: "A guided product design pathway covering problem framing, user research, interface systems, prototyping, testing, and case-study communication.",
      weeks: 10,
      hours: 8,
      outcomes: ["Frame a useful product problem", "Build and test an interactive prototype", "Present a clear design case study"],
      requirements: ["A laptop with reliable internet", "Comfort using web applications", "Eight hours each week for live and project work"],
      skills: ["Product thinking", "User research", "Interface design", "Prototyping"],
      courseId: cohortCourses[0].id,
      cohort: {
        slug: "preview-product-design-october-2026",
        title: "[Preview] October 2026 cohort",
        opens: "2026-08-23T00:00:00.000Z",
        closes: "2026-09-20T22:59:59.000Z",
        starts: "2026-10-05T17:00:00.000Z",
        ends: "2026-12-18T17:00:00.000Z",
        capacity: 28,
        price: 85000,
        schedule: "Tuesdays and Thursdays, 6:00–7:30 PM WAT, with a Saturday project clinic twice monthly.",
        weekly: ["Live studio: Tue & Thu", "Peer pod: one flexible hour", "Project clinic: alternate Saturdays"],
      },
    },
    {
      slug: "preview-ai-workflows-for-creatives",
      title: "[Preview] AI workflows for creatives",
      shortDescription: "Build reliable AI-assisted research, content, and delivery workflows without losing creative judgment.",
      description: "A project-led pathway for creatives who want to use generative AI deliberately, evaluate outputs, automate repeatable work, and document responsible workflows.",
      weeks: 8,
      hours: 6,
      outcomes: ["Design a repeatable AI-assisted workflow", "Evaluate and improve generated outputs", "Ship a documented automation project"],
      requirements: ["A laptop with reliable internet", "Experience in any creative discipline", "Six hours each week for practice and live sessions"],
      skills: ["Prompt systems", "Workflow design", "Output evaluation", "Creative automation"],
      courseId: cohortCourses[1].id,
      cohort: {
        slug: "preview-ai-workflows-october-2026",
        title: "[Preview] October 2026 cohort",
        opens: "2026-08-23T00:00:00.000Z",
        closes: "2026-10-04T22:59:59.000Z",
        starts: "2026-10-19T17:00:00.000Z",
        ends: "2026-12-11T17:00:00.000Z",
        capacity: 36,
        price: 65000,
        schedule: "Mondays, 6:00–7:30 PM WAT, plus a Wednesday feedback room and flexible peer practice.",
        weekly: ["Live workshop: Monday", "Feedback room: Wednesday", "Independent build: 3–4 hours"],
      },
    },
    {
      slug: "preview-frontend-product-engineering",
      title: "[Preview] Frontend product engineering",
      shortDescription: "Build accessible, production-minded web interfaces from product brief to deployed project.",
      description: "A structured frontend pathway combining modern React, interface architecture, accessibility, testing, code review, and a team capstone.",
      weeks: 16,
      hours: 12,
      outcomes: ["Build accessible React interfaces", "Work through review and revision", "Ship a team-based product capstone"],
      requirements: ["Basic HTML, CSS, and JavaScript", "A laptop able to run a local development environment", "Twelve hours each week for classes and project work"],
      skills: ["React", "TypeScript", "Accessibility", "Testing", "Team delivery"],
      courseId: cohortCourses[2].id,
      cohort: {
        slug: "preview-frontend-november-2026",
        title: "[Preview] November 2026 cohort",
        opens: "2026-08-23T00:00:00.000Z",
        closes: "2026-10-25T22:59:59.000Z",
        starts: "2026-11-09T17:00:00.000Z",
        ends: "2027-02-26T17:00:00.000Z",
        capacity: 24,
        price: 145000,
        schedule: "Mondays and Wednesdays, 6:00–8:00 PM WAT, plus a Friday code review and team build time.",
        weekly: ["Live class: Mon & Wed", "Code review: Friday", "Team build: 5–6 flexible hours"],
      },
    },
  ];

  for (const preview of previewPrograms) {
    const program = await db.program.upsert({
      where: { slug: preview.slug },
      create: {
        schoolId: school.id,
        title: preview.title,
        slug: preview.slug,
        shortDescription: preview.shortDescription,
        description: preview.description,
        estimatedDurationWeeks: preview.weeks,
        weeklyCommitmentHours: preview.hours,
        outcomes: preview.outcomes,
        requirements: preview.requirements,
        skills: preview.skills,
        status: "PUBLISHED",
      },
      update: {
        title: preview.title,
        shortDescription: preview.shortDescription,
        description: preview.description,
        estimatedDurationWeeks: preview.weeks,
        weeklyCommitmentHours: preview.hours,
        outcomes: preview.outcomes,
        requirements: preview.requirements,
        skills: preview.skills,
        status: "PUBLISHED",
      },
    });

    await db.programCourse.upsert({
      where: { programId_courseId: { programId: program.id, courseId: preview.courseId } },
      create: { programId: program.id, courseId: preview.courseId, position: 1 },
      update: { position: 1, required: true },
    });

    await db.cohort.upsert({
      where: { slug: preview.cohort.slug },
      create: {
        programId: program.id,
        leadInstructorId: instructor.id,
        title: preview.cohort.title,
        slug: preview.cohort.slug,
        status: "APPLICATIONS_OPEN",
        applicationOpenAt: new Date(preview.cohort.opens),
        applicationCloseAt: new Date(preview.cohort.closes),
        startsAt: new Date(preview.cohort.starts),
        endsAt: new Date(preview.cohort.ends),
        capacity: preview.cohort.capacity,
        price: preview.cohort.price,
        scheduleSummary: preview.cohort.schedule,
        weeklySchedule: preview.cohort.weekly,
        graduationRules: ["Complete at least 80% of required learning", "Submit the final project", "Address required feedback before completion"],
      },
      update: {
        programId: program.id,
        leadInstructorId: instructor.id,
        status: "APPLICATIONS_OPEN",
        applicationOpenAt: new Date(preview.cohort.opens),
        applicationCloseAt: new Date(preview.cohort.closes),
        startsAt: new Date(preview.cohort.starts),
        endsAt: new Date(preview.cohort.ends),
        capacity: preview.cohort.capacity,
        price: preview.cohort.price,
        scheduleSummary: preview.cohort.schedule,
        weeklySchedule: preview.cohort.weekly,
      },
    });
  }

  const learningCohort = await db.cohort.findUniqueOrThrow({
    where: { slug: "preview-ai-workflows-october-2026" },
    select: { id: true, programId: true },
  });
  await db.user.update({
    where: { id: instructor.id },
    data: {
      headline: "[Preview] Creative workflow mentor",
      publicProfileSlug: "local-qa-workflow-mentor",
      publicProfileStatus: "PUBLIC",
      instructorProfileEnabled: true,
      instructorVerificationStatus: "VERIFIED",
      instructorVerifiedAt: new Date("2026-08-23T11:00:00.000Z"),
      mentorshipEligible: true,
      mentorshipEnabled: true,
      mentorshipApprovedAt: new Date("2026-08-23T11:30:00.000Z"),
      mentorshipFree: true,
      mentorshipBio: "Local-only mentor profile for reviewing cohort project feedback and booking context.",
      mentorshipTopics: ["Project feedback", "Workflow design", "Portfolio review"],
      mentorshipInstructions: "Bring one specific decision or draft you want to improve. This is a local QA fixture, not a real mentor listing.",
    },
  });
  let mentorAvailability = await db.mentorAvailability.findFirst({ where: { mentorId: instructor.id, type: "WEEKLY", weekday: 2, startTime: "14:00", status: { not: "ARCHIVED" } } });
  mentorAvailability ??= await db.mentorAvailability.create({ data: { mentorId: instructor.id, type: "WEEKLY", weekday: 2, startTime: "14:00", endTime: "16:00", timezone: "Africa/Lagos", sessionDuration: 45, bufferMinutes: 15, maxBookings: 2, status: "ACTIVE" } });
  if (mentorAvailability.status !== "ACTIVE") await db.mentorAvailability.update({ where: { id: mentorAvailability.id }, data: { status: "ACTIVE" } });
  await db.cohortMentorAssignment.upsert({
    where: { cohortId_mentorId: { cohortId: learningCohort.id, mentorId: instructor.id } },
    create: { cohortId: learningCohort.id, mentorId: instructor.id, role: "Applied project mentor", focusAreas: ["Project feedback", "Workflow design", "Portfolio review"], status: "ACTIVE" },
    update: { role: "Applied project mentor", focusAreas: ["Project feedback", "Workflow design", "Portfolio review"], status: "ACTIVE" },
  });
  await db.cohort.update({ where: { id: learningCohort.id }, data: { price: 0 } });
  await db.cohortApplication.upsert({
    where: { cohortId_userId: { cohortId: learningCohort.id, userId: learner.id } },
    create: {
      cohortId: learningCohort.id,
      userId: learner.id,
      status: "ACCEPTED",
      background: "Local-only learner dashboard fixture for reviewing a confirmed cohort membership.",
      goals: "Review program courses, schedule, announcements, and truthful progress states.",
      prerequisites: "Local QA requirements confirmed.",
      answers: { country: "Nigeria", experienceLevel: "SOME_EXPERIENCE", weeklyHours: 6, hasLaptop: true, hasReliableInternet: true, commitmentConfirmed: true },
      submittedAt: new Date("2026-08-23T12:00:00.000Z"),
      reviewedAt: new Date("2026-08-23T13:00:00.000Z"),
      reviewedById: admin.id,
      reviewNote: "Local-only accepted fixture for the cohort learning dashboard.",
    },
    update: {
      status: "ACCEPTED",
      reviewedAt: new Date("2026-08-23T13:00:00.000Z"),
      reviewedById: admin.id,
      reviewNote: "Local-only accepted fixture for the cohort learning dashboard.",
      offerExpiresAt: null,
    },
  });
  await db.cohortMembership.upsert({
    where: { cohortId_userId: { cohortId: learningCohort.id, userId: learner.id } },
    create: { cohortId: learningCohort.id, userId: learner.id, role: "LEARNER", status: "ACTIVE", joinedAt: new Date("2026-08-23T13:00:00.000Z") },
    update: { role: "LEARNER", status: "ACTIVE", joinedAt: new Date("2026-08-23T13:00:00.000Z") },
  });
  await db.cohortMembership.upsert({
    where: { cohortId_userId: { cohortId: learningCohort.id, userId: admin.id } },
    create: { cohortId: learningCohort.id, userId: admin.id, role: "LEARNER", status: "ACTIVE", joinedAt: new Date("2026-08-23T13:05:00.000Z") },
    update: { role: "LEARNER", status: "ACTIVE" },
  });
  const learningCourses = await db.programCourse.findMany({ where: { programId: learningCohort.programId }, select: { courseId: true } });
  for (const { courseId } of learningCourses) {
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: learner.id, courseId } },
      create: { userId: learner.id, courseId, status: "ACTIVE", enrolledAt: new Date("2026-08-23T13:00:00.000Z") },
      update: { status: "ACTIVE" },
    });
  }

  const announcement = await db.announcement.findFirst({ where: { cohortId: learningCohort.id, title: "[Preview] Welcome to your cohort workspace" }, select: { id: true } });
  if (announcement) {
    await db.announcement.update({ where: { id: announcement.id }, data: { status: "PUBLISHED", body: "This is local QA copy. Review the learning plan and orientation details before the cohort begins.", publishedAt: new Date("2026-08-23T14:00:00.000Z") } });
  } else {
    await db.announcement.create({ data: { cohortId: learningCohort.id, authorId: admin.id, title: "[Preview] Welcome to your cohort workspace", body: "This is local QA copy. Review the learning plan and orientation details before the cohort begins.", audience: "STUDENTS", status: "PUBLISHED", priority: 10, publishedAt: new Date("2026-08-23T14:00:00.000Z") } });
  }

  const orientation = await db.scheduleEvent.findFirst({ where: { cohortId: learningCohort.id, title: "[Preview] Cohort orientation" }, select: { id: true } });
  const orientationData = { cohortId: learningCohort.id, createdById: admin.id, type: "LIVE_SESSION" as const, audience: "COHORT_MEMBERS" as const, status: "SCHEDULED" as const, title: "[Preview] Cohort orientation", description: "Local QA event for reviewing cohort schedule visibility. No real meeting is represented.", startsAt: new Date("2026-09-28T17:00:00.000Z"), endsAt: new Date("2026-09-28T18:00:00.000Z"), timezone: "Africa/Lagos" };
  if (orientation) await db.scheduleEvent.update({ where: { id: orientation.id }, data: orientationData });
  else await db.scheduleEvent.create({ data: orientationData });

  const project = await db.cohortProject.upsert({
    where: { cohortId_slug: { cohortId: learningCohort.id, slug: "responsible-creative-workflow-case-study" } },
    create: {
      cohortId: learningCohort.id,
      createdById: admin.id,
      slug: "responsible-creative-workflow-case-study",
      title: "[Preview] Responsible creative workflow case study",
      brief: "Design and document a repeatable AI-assisted workflow for a real creative task. Show where human judgment enters the process, how you evaluate outputs, and what you changed after testing.",
      deliverables: ["A working workflow artifact or demonstration", "A case study explaining the problem, process, and decisions", "Evidence of evaluation, iteration, and responsible-use safeguards"],
      dueAt: new Date("2026-11-30T22:59:59.000Z"),
      status: "PUBLISHED",
      showcaseEligible: true,
      credentialTitle: "Applied AI Workflow Project",
    },
    update: { status: "PUBLISHED", showcaseEligible: true, dueAt: new Date("2026-11-30T22:59:59.000Z") },
  });
  const rubric = [
    { key: "workflow-design", title: "Workflow design", description: "The workflow is coherent, repeatable, and appropriate for the stated creative problem.", maxScore: 5, position: 1 },
    { key: "judgment-evaluation", title: "Judgment and evaluation", description: "The learner defines quality, tests outputs, and documents meaningful human decisions.", maxScore: 5, position: 2 },
    { key: "documentation", title: "Documentation", description: "The case study communicates the process, iterations, constraints, and outcome clearly.", maxScore: 5, position: 3 },
  ];
  for (const criterion of rubric) {
    await db.projectRubricCriterion.upsert({
      where: { projectId_key: { projectId: project.id, key: criterion.key } },
      create: { projectId: project.id, ...criterion },
      update: criterion,
    });
  }
  const learnerSubmission = await db.projectSubmission.upsert({
    where: { projectId_userId: { projectId: project.id, userId: learner.id } },
    create: {
      projectId: project.id,
      userId: learner.id,
      status: "SUBMITTED",
      title: "[Preview] A quality-controlled campaign workflow",
      summary: "Local QA evidence for reviewing the end-to-end project workflow. The case study frames a campaign-production problem, defines quality checks, records human approval gates, and explains how test feedback changed the final sequence. It is deliberately labelled preview content and makes no claim about a real learner achievement.",
      artifactUrl: "https://example.test/cscn-local-qa/artifact",
      repositoryUrl: "https://example.test/cscn-local-qa/repository",
      demoUrl: "https://example.test/cscn-local-qa/demo",
      showcaseConsent: true,
      currentVersion: 1,
      submittedAt: new Date("2026-08-23T15:00:00.000Z"),
    },
    update: {},
  });
  if (learnerSubmission.currentVersion === 0) {
    await db.projectSubmission.update({ where: { id: learnerSubmission.id }, data: { status: "SUBMITTED", currentVersion: 1, submittedAt: new Date("2026-08-23T15:00:00.000Z") } });
  }
  await db.projectSubmissionVersion.upsert({
    where: { submissionId_version: { submissionId: learnerSubmission.id, version: 1 } },
    create: {
      submissionId: learnerSubmission.id,
      version: 1,
      title: learnerSubmission.title,
      summary: learnerSubmission.summary,
      artifactUrl: learnerSubmission.artifactUrl,
      repositoryUrl: learnerSubmission.repositoryUrl,
      demoUrl: learnerSubmission.demoUrl,
      coverImageUrl: learnerSubmission.coverImageUrl,
      submittedAt: learnerSubmission.submittedAt ?? new Date("2026-08-23T15:00:00.000Z"),
    },
    update: {},
  });

  const critiqueSpace = await db.communitySpace.upsert({
    where: { slug: "preview-project-critique" },
    create: {
      slug: "preview-project-critique",
      title: "[Preview] Project critique room",
      description: "A local QA space for practicing specific, constructive feedback on work in progress.",
      kind: "PROJECT_CRITIQUE",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      createdById: admin.id,
      guidelines: ["Describe the decision you want help with", "Critique the work, never the person", "Do not share private client material"],
    },
    update: { status: "PUBLISHED", visibility: "PUBLIC", createdById: admin.id },
  });
  const cohortSpace = await db.communitySpace.upsert({
    where: { slug: "preview-ai-workflows-cohort-room" },
    create: {
      slug: "preview-ai-workflows-cohort-room",
      title: "[Preview] AI workflows cohort room",
      description: "The local-only member room for cohort questions, peer practice, and learning updates.",
      kind: "COHORT",
      visibility: "MEMBERS_ONLY",
      status: "PUBLISHED",
      cohortId: learningCohort.id,
      programId: learningCohort.programId,
      createdById: admin.id,
      guidelines: ["Keep discussion connected to the learning journey", "Share feedback with care and useful context", "Report unsafe or misleading content"],
    },
    update: { status: "PUBLISHED", visibility: "MEMBERS_ONLY", cohortId: learningCohort.id, programId: learningCohort.programId, createdById: admin.id },
  });
  for (const membership of [
    { spaceId: critiqueSpace.id, userId: admin.id, role: "MODERATOR" as const },
    { spaceId: critiqueSpace.id, userId: learner.id, role: "MEMBER" as const },
    { spaceId: cohortSpace.id, userId: admin.id, role: "MODERATOR" as const },
    { spaceId: cohortSpace.id, userId: learner.id, role: "MEMBER" as const },
  ]) {
    await db.communityMembership.upsert({
      where: { spaceId_userId: { spaceId: membership.spaceId, userId: membership.userId } },
      create: { ...membership, status: "ACTIVE" },
      update: { role: membership.role, status: "ACTIVE" },
    });
  }
  let critiquePost = await db.communityPost.findFirst({ where: { spaceId: critiqueSpace.id, authorId: learner.id, title: "[Preview] Help me test this project story" } });
  critiquePost ??= await db.communityPost.create({ data: { spaceId: critiqueSpace.id, authorId: learner.id, title: "[Preview] Help me test this project story", body: "Local QA discussion: Is the problem and human approval step clear enough in this workflow case-study outline? I am looking for one specific suggestion about the sequence.", status: "PUBLISHED", isPinned: true } });
  const critiqueReply = await db.communityPost.findFirst({ where: { parentId: critiquePost.id, authorId: admin.id } });
  if (!critiqueReply) await db.communityPost.create({ data: { spaceId: critiqueSpace.id, authorId: admin.id, parentId: critiquePost.id, body: "The approval step is visible. For the next revision, name the quality signal that causes a human reviewer to reject an output.", status: "PUBLISHED" } });
  const cohortWelcome = await db.communityPost.findFirst({ where: { spaceId: cohortSpace.id, title: "[Preview] Start here: how this room supports learning" } });
  if (!cohortWelcome) await db.communityPost.create({ data: { spaceId: cohortSpace.id, authorId: admin.id, title: "[Preview] Start here: how this room supports learning", body: "Use this room for cohort questions, study-group coordination, and project feedback. Schedule and official announcements remain in your cohort dashboard.", status: "PUBLISHED", isPinned: true } });

  const careerFixtures = [
    { slug: "preview-junior-product-designer", company: "[Preview] Northstar Studio", role: "[Preview] Junior product designer", summary: "Local QA opportunity for reviewing discovery, filters, saving, and external-application tracking.", description: "This fictional local fixture describes an entry-level product design role focused on research synthesis, interface iteration, and documented collaboration. It is not a real vacancy.", location: "Lagos, Nigeria", workplaceType: "HYBRID" as const, employmentType: "FULL_TIME" as const, level: "ENTRY" as const, skills: ["Figma", "User research", "Prototyping"], salaryText: "Not supplied — preview fixture", featured: true },
    { slug: "preview-frontend-intern", company: "[Preview] Build Lab", role: "[Preview] Frontend engineering intern", summary: "Local QA opportunity for testing the Career Hub without representing a real employer or vacancy.", description: "This fictional local fixture covers accessible interface implementation, code review, and guided React project work. It is not open for real applications.", location: "Remote · Nigeria", workplaceType: "REMOTE" as const, employmentType: "INTERNSHIP" as const, level: "ENTRY" as const, skills: ["React", "TypeScript", "Accessibility"], salaryText: "Not supplied — preview fixture", featured: false },
  ];
  for (const fixture of careerFixtures) {
    await db.careerOpportunity.upsert({
      where: { slug: fixture.slug },
      create: { ...fixture, applicationUrl: `https://example.test/cscn-local-qa/${fixture.slug}`, source: "Local QA fixture", applicationDeadline: new Date("2026-11-30T22:59:59.000Z"), postedAt: new Date("2026-08-24T09:00:00.000Z"), status: "PUBLISHED", createdById: admin.id },
      update: { ...fixture, applicationUrl: `https://example.test/cscn-local-qa/${fixture.slug}`, source: "Local QA fixture", applicationDeadline: new Date("2026-11-30T22:59:59.000Z"), status: "PUBLISHED", createdById: admin.id },
    });
  }
  const workshop = await db.scheduleEvent.findFirst({ where: { title: "[Preview] Portfolio evidence clinic", createdById: admin.id }, select: { id: true } });
  const workshopData = { createdById: admin.id, type: "PLATFORM_EVENT" as const, audience: "ALL_STUDENTS" as const, status: "SCHEDULED" as const, title: "[Preview] Portfolio evidence clinic", description: "Local QA workshop copy for practicing how to explain project decisions and evidence. No live event or meeting is promised.", startsAt: new Date("2026-10-08T17:00:00.000Z"), endsAt: new Date("2026-10-08T18:00:00.000Z"), timezone: "Africa/Lagos", metadata: { kind: "CAREER_WORKSHOP", fixture: "LOCAL_QA" } };
  if (workshop) await db.scheduleEvent.update({ where: { id: workshop.id }, data: workshopData });
  else await db.scheduleEvent.create({ data: workshopData });
  await db.careerTalentProfile.upsert({
    where: { userId: learner.id },
    create: { userId: learner.id, discoverable: true, targetRoles: ["Junior product designer"], skills: ["Figma", "Workflow design"], availability: "From January 2027", preferredWorkplace: "HYBRID", cvUrl: "https://example.test/cscn-local-qa/cv", statement: "Local QA talent-profile copy. This is not a real candidate endorsement." },
    update: { discoverable: true, targetRoles: ["Junior product designer"], skills: ["Figma", "Workflow design"], availability: "From January 2027", preferredWorkplace: "HYBRID", cvUrl: "https://example.test/cscn-local-qa/cv", statement: "Local QA talent-profile copy. This is not a real candidate endorsement." },
  });

  const organization = await db.organization.upsert({
    where: { slug: "preview-northstar-learning-studio" },
    create: {
      name: "[Preview] Northstar Learning Studio",
      slug: "preview-northstar-learning-studio",
      type: "AGENCY",
      status: "ACTIVE",
      description: "Local-only organization fixture for reviewing CSCN seats, invitations, assignments, invoices, and aggregate learning reports.",
      websiteUrl: "https://example.test/cscn-local-qa/organization",
      officialDomain: "local.cscn.test",
      country: "Nigeria",
      requestedById: admin.id,
      approvedById: admin.id,
      approvedAt: new Date("2026-08-24T10:00:00.000Z"),
    },
    update: { status: "ACTIVE", approvedById: admin.id, approvedAt: new Date("2026-08-24T10:00:00.000Z") },
  });
  const organizationOwner = await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: admin.id } },
    create: { organizationId: organization.id, userId: admin.id, role: "OWNER", status: "ACTIVE", jobTitle: "[Preview] Learning operations lead", joinedAt: new Date("2026-08-24T10:00:00.000Z") },
    update: { role: "OWNER", status: "ACTIVE" },
  });
  const organizationLearner = await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: learner.id } },
    create: { organizationId: organization.id, userId: learner.id, role: "LEARNER", status: "ACTIVE", jobTitle: "[Preview] Creative associate", joinedAt: new Date("2026-08-24T10:15:00.000Z") },
    update: { role: "LEARNER", status: "ACTIVE" },
  });
  const organizationManager = await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: organization.id, userId: instructor.id } },
    create: { organizationId: organization.id, userId: instructor.id, role: "MANAGER", status: "ACTIVE", jobTitle: "[Preview] Team facilitator", joinedAt: new Date("2026-08-24T10:20:00.000Z") },
    update: { role: "MANAGER", status: "ACTIVE" },
  });
  const creativeTeam = await db.organizationTeam.upsert({
    where: { organizationId_name: { organizationId: organization.id, name: "[Preview] Creative operations" } },
    create: { organizationId: organization.id, name: "[Preview] Creative operations", description: "Local QA team for validating learning assignment visibility." },
    update: { description: "Local QA team for validating learning assignment visibility." },
  });
  for (const memberId of [organizationOwner.id, organizationLearner.id, organizationManager.id]) {
    await db.organizationTeamMember.upsert({ where: { teamId_organizationMemberId: { teamId: creativeTeam.id, organizationMemberId: memberId } }, create: { teamId: creativeTeam.id, organizationMemberId: memberId }, update: {} });
  }
  const privateTeamCohort = await db.cohort.upsert({
    where: { slug: "preview-northstar-ai-team-october-2026" },
    create: { organizationId: organization.id, programId: learningCohort.programId, title: "[Preview] Northstar private AI cohort", slug: "preview-northstar-ai-team-october-2026", status: "APPLICATIONS_CLOSED", applicationOpenAt: new Date("2026-08-24T10:00:00.000Z"), applicationCloseAt: new Date("2026-08-24T10:00:00.000Z"), startsAt: new Date("2026-10-19T17:00:00.000Z"), endsAt: new Date("2026-12-11T17:00:00.000Z"), capacity: 5, price: 0, applicationRequired: false, graduationRules: ["Complete assigned learning", "Meet the program completion threshold"], scheduleSummary: "Private local QA cohort: Mondays at 6:00 PM WAT with a Wednesday feedback room.", weeklySchedule: ["Live workshop: Monday", "Feedback room: Wednesday"] },
    update: { organizationId: organization.id, status: "APPLICATIONS_CLOSED", applicationRequired: false, capacity: 5, price: 0 },
  });
  await db.cohortMembership.upsert({ where: { cohortId_userId: { cohortId: privateTeamCohort.id, userId: learner.id } }, create: { cohortId: privateTeamCohort.id, userId: learner.id, role: "LEARNER", status: "ACTIVE", joinedAt: new Date("2026-08-24T11:15:00.000Z") }, update: { role: "LEARNER", status: "ACTIVE" } });
  let teamSeatPackage = await db.organizationSeatPackage.findFirst({ where: { organizationId: organization.id, notes: { contains: "LOCAL_QA" } } });
  const teamSeatData = { organizationId: organization.id, cohortId: privateTeamCohort.id, programId: null, quantity: 5, pricePerSeat: 45000, currency: "NGN", status: "ACTIVE" as const, startsAt: new Date("2026-08-24T11:00:00.000Z"), expiresAt: new Date("2027-03-31T22:59:59.000Z"), createdById: admin.id, notes: "LOCAL_QA: active preview seat package; no real purchase or organization is represented." };
  if (teamSeatPackage) teamSeatPackage = await db.organizationSeatPackage.update({ where: { id: teamSeatPackage.id }, data: teamSeatData });
  else teamSeatPackage = await db.organizationSeatPackage.create({ data: teamSeatData });
  await db.organizationInvoice.upsert({
    where: { seatPackageId: teamSeatPackage.id },
    create: { organizationId: organization.id, seatPackageId: teamSeatPackage.id, number: "QA-ORG-2026-0001", amount: 225000, currency: "NGN", status: "PAID", issuedById: admin.id, issuedAt: new Date("2026-08-24T10:30:00.000Z"), dueAt: new Date("2026-09-07T22:59:59.000Z"), paidAt: new Date("2026-08-24T11:00:00.000Z"), metadata: { fixture: "LOCAL_QA", payment: "No real funds represented" } },
    update: { status: "PAID", paidAt: new Date("2026-08-24T11:00:00.000Z"), amount: 225000 },
  });
  await db.organizationSeatAllocation.upsert({
    where: { seatPackageId_organizationMemberId: { seatPackageId: teamSeatPackage.id, organizationMemberId: organizationLearner.id } },
    create: { seatPackageId: teamSeatPackage.id, organizationMemberId: organizationLearner.id, allocatedById: admin.id, status: "ACTIVE", assignedAt: new Date("2026-08-24T11:15:00.000Z") },
    update: { status: "ACTIVE", revokedAt: null },
  });
  let teamAssignment = await db.organizationLearningAssignment.findFirst({ where: { organizationId: organization.id, seatPackageId: teamSeatPackage.id, title: "[Preview] Responsible AI workflow practice" } });
  const teamAssignmentData = { organizationId: organization.id, teamId: creativeTeam.id, seatPackageId: teamSeatPackage.id, programId: null, cohortId: privateTeamCohort.id, title: "[Preview] Responsible AI workflow practice", description: "Complete the local preview cohort project and bring one documented quality decision to the team review.", dueAt: new Date("2026-11-30T22:59:59.000Z"), status: "ACTIVE" as const, createdById: admin.id };
  if (teamAssignment) teamAssignment = await db.organizationLearningAssignment.update({ where: { id: teamAssignment.id }, data: teamAssignmentData });
  else teamAssignment = await db.organizationLearningAssignment.create({ data: teamAssignmentData });
  const inviteToken = "local-qa-team-invite-2026";
  const inviteHash = createHash("sha256").update(inviteToken).digest("hex");
  await db.organizationInvitation.upsert({
    where: { tokenHash: inviteHash },
    create: { organizationId: organization.id, teamId: creativeTeam.id, email: "team-invite@local.cscn.test", role: "LEARNER", status: "PENDING", tokenHash: inviteHash, invitedById: admin.id, expiresAt: new Date("2027-01-31T22:59:59.000Z") },
    update: { status: "PENDING", acceptedAt: null, expiresAt: new Date("2027-01-31T22:59:59.000Z") },
  });

  console.log("Local QA fixtures are ready.");
  console.log("Learner: learner@local.cscn.test / LocalReviewOnly!2026");
  console.log("Admin: admin@local.cscn.test / LocalReviewOnly!2026");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
