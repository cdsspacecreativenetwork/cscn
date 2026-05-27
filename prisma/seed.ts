import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

const url = (process.env.DATABASE_URL ?? "").replace(/^['"]|['"]$/g, "");
const adapter = new PrismaNeonHttp(url, {});
const db = new PrismaClient({ adapter });

// ─── Types ────────────────────────────────────────────────────────────────────

type LessonSeed = {
  title: string;
  position: number;
  videoUrl: string;
  duration: number;
  isPreview: boolean;
};

type ModuleSeed = {
  title: string;
  position: number;
  lessons: LessonSeed[];
};

type CourseSeed = {
  title: string;
  slug: string;
  description: string;
  shortDesc: string;
  thumbnail: string;
  promoVideo: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  previewCount: number;
  requirements: string[];
  includes: string[];
  modules: ModuleSeed[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function findOrCreateCategory(name: string, slug: string) {
  const existing = await db.category.findUnique({ where: { slug } });
  if (existing) return existing;
  return db.category.create({ data: { name, slug } });
}

async function upsertInstructor(data: {
  email: string;
  name: string;
  headline: string;
  bio: string;
}) {
  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return db.user.update({
      where: { email: data.email },
      data: { name: data.name, headline: data.headline, bio: data.bio },
    });
  }
  return db.user.create({ data: { ...data, role: "INSTRUCTOR" } });
}

async function seedCourse(
  data: CourseSeed,
  categoryId: string,
  instructorId: string
) {
  const { modules, requirements, includes, ...rest } = data;

  // Full upsert — always sync metadata, instructor, and category
  let course = await db.course.findUnique({ where: { slug: data.slug } });
  if (course) {
    course = await db.course.update({
      where: { slug: data.slug },
      data: {
        title: rest.title,
        description: rest.description,
        shortDesc: rest.shortDesc,
        thumbnail: rest.thumbnail,
        promoVideo: rest.promoVideo,
        difficulty: rest.difficulty,
        previewCount: rest.previewCount,
        requirements,
        includes,
        categoryId,
        instructorId,
        status: "PUBLISHED",
      },
    });
    console.log(`  ↻ ${data.slug}`);
  } else {
    course = await db.course.create({
      data: {
        ...rest,
        requirements,
        includes,
        categoryId,
        instructorId,
        status: "PUBLISHED",
      },
    });
    console.log(`  ✓ ${data.slug}`);
  }

  // Additive — only create modules/lessons that don't exist at that position
  for (const mod of modules) {
    const { lessons, ...moduleData } = mod;

    let dbMod = await db.module.findFirst({
      where: { courseId: course.id, position: mod.position },
    });

    if (!dbMod) {
      dbMod = await db.module.create({
        data: { ...moduleData, courseId: course.id, isPublished: true },
      });
    }

    for (const lesson of lessons) {
      const exists = await db.lesson.findFirst({
        where: { moduleId: dbMod.id, position: lesson.position },
      });
      if (!exists) {
        await db.lesson.create({
          data: { ...lesson, contentType: "VIDEO", moduleId: dbMod.id, isPublished: true },
        });
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Categories ───────────────────────────────────────────────────────────────
  const [
    dataScienceCat,
    webDevCat,
    cyberCat,
    uiUxCat,
    brandCat,
    aiEngCat,
    motionCat,
  ] = await Promise.all([
    findOrCreateCategory("Data Science", "data-science"),
    findOrCreateCategory("Web Development", "web-development"),
    findOrCreateCategory("Cybersecurity", "cybersecurity"),
    findOrCreateCategory("UI/UX Design", "ui-ux-design"),
    findOrCreateCategory("Brand Identity", "brand-identity"),
    findOrCreateCategory("AI Engineering", "ai-engineering"),
    findOrCreateCategory("Motion Design", "motion-design"),
  ]);

  // ── Instructors ───────────────────────────────────────────────────────────────
  const [david, chisom, ernest, ayomide, barry] = await Promise.all([
    upsertInstructor({
      email: "david.adeyemi@cscn.edu",
      name: "David Adeyemi",
      headline: "Senior Data Scientist & ML Researcher",
      bio: "David has over 10 years of experience building machine learning systems at scale for fintech, e-commerce, and health platforms across Africa and Europe. His teaching philosophy: build deep intuition first, then write the code. He has trained over 3,000 engineers since 2019.",
    }),
    upsertInstructor({
      email: "chisom.nwosu@cscn.edu",
      name: "Chisom Nwosu",
      headline: "Staff Software Engineer · ex-Stripe, Andela",
      bio: "Chisom is a full-stack engineer with 14 years building production-grade systems in TypeScript, React, and Go. She led engineering teams at Stripe Lagos and Andela, and is obsessed with teaching patterns that actually survive contact with production traffic.",
    }),
    upsertInstructor({
      email: "ernest.obi@cscn.edu",
      name: "Ernest Obi",
      headline: "Principal Product Designer · ex-Paystack, Meta",
      bio: "Ernest led product design at Paystack through its $200M acquisition by Stripe, and previously designed consumer products at Meta. He has 12+ years of experience in UIUX and design systems, and believes the best designers in the world will come from Africa.",
    }),
    upsertInstructor({
      email: "ayomide.ajayi@cscn.edu",
      name: "Ayomide Ajayi",
      headline: "Creative Director & Brand Strategist · ex-Ogilvy Africa",
      bio: "Ayomide has built brand identities for Fortune 500 companies and hypergrowth startups across three continents. She ran creative direction at Ogilvy Africa for 7 years and now runs her own brand studio. Her conviction: a great brand is a story, not a logo.",
    }),
    upsertInstructor({
      email: "barry.okafor@cscn.edu",
      name: "Barry Okafor",
      headline: "AI Engineer & Product Lead · YC W24 Startup",
      bio: "Barry builds LLM-powered products and has shipped AI features used by over 500,000 users. He is a YC W24 founder and former ML engineer at a Series B fintech. He created this course because he wanted the course he wished existed when he started — practical, opinionated, no PhD required.",
    }),
  ]);

  console.log("Seeding courses...");

  // ── 1. Machine Learning A-Z ───────────────────────────────────────────────────
  await seedCourse(
    {
      title: "Machine Learning A-Z: From Foundations to Deployment",
      slug: "machine-learning-a-to-z",
      description: `A complete, industry-grade guide to machine learning for 2026. You will move from core mathematics through classical algorithms, deep learning, and model evaluation — finishing with a deployed ML pipeline on the cloud.

Whether you are a developer adding ML to your toolkit or a data analyst aiming to become a full data scientist, this course builds real intuition alongside hands-on Python projects using scikit-learn, PyTorch, and FastAPI.

By the end you will have built and deployed three end-to-end ML systems, understand how to evaluate models honestly, and know how to communicate results to non-technical stakeholders.`,
      shortDesc:
        "Master ML from linear regression to neural networks — theory, code, and production deployment.",
      thumbnail: "https://img.youtube.com/vi/GwIo3gDZCVQ/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
      difficulty: "BEGINNER",
      previewCount: 2,
      requirements: [
        "Intermediate Python (functions, loops, classes)",
        "High school level statistics and probability",
        "A machine capable of running Jupyter notebooks",
        "No prior machine learning experience required",
      ],
      includes: [
        "22 hours on-demand video",
        "Assignments & graded coding exercises",
        "Downloadable Jupyter notebooks for every lesson",
        "Certificate of completion",
      ],
      modules: [
        // Positions 1-3 already exist — only expand with new modules
        {
          title: "Decision Trees, Random Forests & Gradient Boosting",
          position: 4,
          lessons: [
            {
              title: "Decision Tree Algorithm: Intuition & Implementation",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Random Forests: Ensemble Learning Explained",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 22,
              isPreview: false,
            },
            {
              title: "XGBoost & Gradient Boosting in Practice",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Feature Importance & SHAP Explainability",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 18,
              isPreview: false,
            },
          ],
        },
        {
          title: "Unsupervised Learning & Dimensionality Reduction",
          position: 5,
          lessons: [
            {
              title: "K-Means Clustering: Theory & Implementation",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Hierarchical & DBSCAN Clustering",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 18,
              isPreview: false,
            },
            {
              title: "PCA: Reducing Dimensions Without Losing Signal",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 20,
              isPreview: false,
            },
            {
              title: "t-SNE & UMAP for High-Dimensional Visualisation",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 16,
              isPreview: false,
            },
          ],
        },
        {
          title: "Model Evaluation, Tuning & Production Deployment",
          position: 6,
          lessons: [
            {
              title: "Cross-Validation & Avoiding Overfitting",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Hyperparameter Tuning with Optuna",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Serving ML Models with FastAPI",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Deploying to the Cloud & Monitoring Model Drift",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=GwIo3gDZCVQ",
              duration: 24,
              isPreview: false,
            },
          ],
        },
      ],
    },
    dataScienceCat.id,
    david.id
  );

  // ── 2. Full-Stack Next.js ────────────────────────────────────────────────────
  await seedCourse(
    {
      title: "Full-Stack Web Development with Next.js",
      slug: "full-stack-nextjs",
      description: `Build production-ready full-stack applications from scratch using Next.js 15, TypeScript, Prisma, and PostgreSQL. This course covers every layer of a modern web product — from database schema design and API architecture to UI component systems, authentication, and CI/CD deployment.

You will ship three complete projects throughout the course: a content-driven marketing site, a REST API with role-based access control, and a full-stack SaaS dashboard application with real authentication and database persistence.

The patterns in this course mirror what top engineering teams use at companies like Vercel, Stripe, and Linear.`,
      shortDesc:
        "Zero to production — build real full-stack apps with Next.js, TypeScript, Prisma, and PostgreSQL.",
      thumbnail: "https://img.youtube.com/vi/wm5gMKuwSYk/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
      difficulty: "INTERMEDIATE",
      previewCount: 1,
      requirements: [
        "Solid JavaScript fundamentals (ES6+ — arrays, async/await, destructuring)",
        "Basic understanding of HTML & CSS",
        "Comfortable using the terminal / command line",
        "No prior React, TypeScript, or Next.js experience required",
      ],
      includes: [
        "20 hours on-demand video",
        "3 complete full-stack projects with source code",
        "Downloadable starter templates & boilerplate",
        "Certificate of completion",
      ],
      modules: [
        // Positions 1-2 already exist
        {
          title: "Building & Securing REST APIs",
          position: 3,
          lessons: [
            {
              title: "REST API Design: Conventions & Best Practices",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Input Validation & Type Safety with Zod",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Rate Limiting, CORS & API Security Headers",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 22,
              isPreview: false,
            },
            {
              title: "File Uploads to Cloudinary & AWS S3",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 20,
              isPreview: false,
            },
          ],
        },
        {
          title: "Advanced React Patterns & UI Architecture",
          position: 4,
          lessons: [
            {
              title: "Component Architecture & Design Systems",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Global State: Zustand, Jotai & TanStack Query",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Animations with Framer Motion",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Accessibility (a11y): Writing Inclusive UIs",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 16,
              isPreview: false,
            },
          ],
        },
        {
          title: "Testing, CI/CD & Production Deployment",
          position: 5,
          lessons: [
            {
              title: "Unit & Integration Testing with Vitest",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 22,
              isPreview: false,
            },
            {
              title: "End-to-End Testing with Playwright",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 24,
              isPreview: false,
            },
            {
              title: "CI/CD Pipeline with GitHub Actions",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Deploying to Vercel: Domains, Edge Config & Analytics",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=wm5gMKuwSYk",
              duration: 18,
              isPreview: false,
            },
          ],
        },
      ],
    },
    webDevCat.id,
    chisom.id
  );

  // ── 3. Cybersecurity Fundamentals ────────────────────────────────────────────
  await seedCourse(
    {
      title: "Cybersecurity Fundamentals: Defend, Detect & Respond",
      slug: "cybersecurity-fundamentals",
      description: `A hands-on, career-focused cybersecurity course for 2026. You will learn the mindset and techniques of both defenders and attackers — covering network security, web application vulnerabilities, cryptography, cloud security, and incident response.

This course is built for software developers, system administrators, and IT professionals who want to understand how systems are compromised and what it practically takes to protect them. No prior security background is required — we start from first principles.

By the end you will be able to threat-model a system, identify the OWASP Top 10 in code, conduct a basic vulnerability assessment, and follow an incident response process from detection to recovery.`,
      shortDesc:
        "Learn to protect systems and think like an attacker — the complete entry point into cybersecurity.",
      thumbnail: "https://img.youtube.com/vi/U_P23SqJaDc/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=U_P23SqJaDc",
      difficulty: "BEGINNER",
      previewCount: 2,
      requirements: [
        "Basic computer knowledge and internet usage",
        "Some familiarity with the command line (helpful but not required)",
        "1–2 hours of focused time per day",
        "No prior security or networking experience needed",
      ],
      includes: [
        "16 hours on-demand video",
        "Hands-on labs & CTF-style challenges",
        "Downloadable cheat sheets & reference guides",
        "Certificate of completion",
      ],
      modules: [
        // Positions 1-2 already exist
        {
          title: "Web Application Security & OWASP Top 10",
          position: 3,
          lessons: [
            {
              title: "SQL Injection: How It Works & How to Prevent It",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 24,
              isPreview: false,
            },
            {
              title: "XSS, CSRF & Server-Side Request Forgery",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Broken Access Control & Privilege Escalation",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Cryptography Fundamentals: Hashing, Encryption & TLS",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 26,
              isPreview: false,
            },
          ],
        },
        {
          title: "Incident Response & Career Paths in Cybersecurity",
          position: 4,
          lessons: [
            {
              title: "The Incident Response Lifecycle",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Log Analysis & SIEM: Reading the Evidence",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Introduction to Penetration Testing",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 28,
              isPreview: false,
            },
            {
              title: "Certifications & Career Roadmap: CEH, OSCP & Beyond",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=U_P23SqJaDc",
              duration: 18,
              isPreview: false,
            },
          ],
        },
      ],
    },
    cyberCat.id,
    david.id
  );

  // ── 4. UI/UX Design Mastery ───────────────────────────────────────────────────
  await seedCourse(
    {
      title: "UI/UX Design Mastery: Research, Design & Ship",
      slug: "uiux-design-mastery",
      description: `The most complete UI/UX design course on CSCN, built for 2026. You will learn the full product design process — from user research and information architecture through high-fidelity Figma design, prototyping, design systems, and developer handoff.

Every module is built around real design briefs. You will design a mobile banking app, a SaaS dashboard, and an e-commerce product experience — building a portfolio that demonstrates both craft and process to any hiring manager or client.

This course reflects how world-class product teams like those at Figma, Linear, and Notion actually work.`,
      shortDesc:
        "Master the full product design process — research, Figma, prototyping, design systems, and handoff.",
      thumbnail: "https://img.youtube.com/vi/dSCLBvxfXLg/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
      difficulty: "BEGINNER",
      previewCount: 2,
      requirements: [
        "No prior design experience required",
        "A laptop or desktop (Mac or Windows) — Figma runs in the browser",
        "Curiosity about how digital products are designed",
        "Willingness to give and receive design critique",
      ],
      includes: [
        "18 hours on-demand video",
        "5 real-world design briefs with feedback",
        "Downloadable Figma files, templates & UI kits",
        "Certificate of completion",
      ],
      modules: [
        {
          title: "Foundations of UX Thinking",
          position: 1,
          lessons: [
            {
              title: "What is Product Design? UX vs UI vs Product",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 14,
              isPreview: true,
            },
            {
              title: "Design Thinking: The 5-Stage Process",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 16,
              isPreview: true,
            },
            {
              title: "Heuristic Evaluation: Critiquing Existing Products",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Visual Design Principles: Hierarchy, Contrast & Spacing",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 20,
              isPreview: false,
            },
          ],
        },
        {
          title: "User Research & Information Architecture",
          position: 2,
          lessons: [
            {
              title: "User Interviews: Recruiting, Script & Synthesis",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 22,
              isPreview: false,
            },
            {
              title: "User Personas & Journey Mapping",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Information Architecture & Card Sorting",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Wireframing: Lo-Fi to Mid-Fi in Figma",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 24,
              isPreview: false,
            },
          ],
        },
        {
          title: "Mastering Figma",
          position: 3,
          lessons: [
            {
              title: "Figma Interface Tour & Essential Shortcuts",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Auto Layout: Building Responsive Components",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Component & Variant Systems",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 28,
              isPreview: false,
            },
            {
              title: "Interactive Prototyping & Smart Animate",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Typography, Colour Styles & Local Variables",
              position: 5,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 22,
              isPreview: false,
            },
          ],
        },
        {
          title: "Building Real Product UIs",
          position: 4,
          lessons: [
            {
              title: "Project: Mobile Banking App — Onboarding Flow",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 34,
              isPreview: false,
            },
            {
              title: "Project: SaaS Dashboard — Data-Dense UI",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 36,
              isPreview: false,
            },
            {
              title: "Project: E-Commerce Product Page",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 30,
              isPreview: false,
            },
          ],
        },
        {
          title: "Design Systems & Developer Handoff",
          position: 5,
          lessons: [
            {
              title: "Building a Scalable Design System from Scratch",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 30,
              isPreview: false,
            },
            {
              title: "Documentation, Tokens & Multi-Brand Theming",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Dev Mode Handoff: Specs, Assets & Code Snippets",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Building Your Portfolio Case Study",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=dSCLBvxfXLg",
              duration: 22,
              isPreview: false,
            },
          ],
        },
      ],
    },
    uiUxCat.id,
    ernest.id
  );

  // ── 5. Brand Identity Design ──────────────────────────────────────────────────
  await seedCourse(
    {
      title: "Brand Identity Design: Strategy, Systems & Scale",
      slug: "brand-identity-design",
      description: `The definitive brand identity course for designers and creative professionals in 2026. You will learn to build brands that are strategically positioned, visually distinctive, and systemically consistent — the kind of brands that attract global clients and retain loyal audiences.

You will work through four real brand briefs across different industries: a tech startup, a consumer goods brand, a cultural institution, and a personal professional brand. Each project pushes you through strategy, naming, visual identity, and presentation.

Taught by a former Creative Director at Ogilvy Africa who has built brands for companies across three continents.`,
      shortDesc:
        "Build brands that last — strategy, logo design, visual systems, and professional presentation.",
      thumbnail: "https://img.youtube.com/vi/v2tBMiJBj70/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=v2tBMiJBj70",
      difficulty: "INTERMEDIATE",
      previewCount: 2,
      requirements: [
        "Basic Adobe Illustrator or Figma experience (can draw and use pen tool)",
        "Access to Adobe Illustrator or Figma (free tier is sufficient)",
        "An understanding of basic design principles",
        "No prior brand strategy knowledge required",
      ],
      includes: [
        "16 hours on-demand video",
        "4 brand brief projects with instructor critique",
        "Downloadable brand guidelines templates & presentation decks",
        "Certificate of completion",
      ],
      modules: [
        {
          title: "Brand Strategy Foundations",
          position: 1,
          lessons: [
            {
              title: "What Makes a Brand Memorable? The Psychology of Branding",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 16,
              isPreview: true,
            },
            {
              title: "Brand Positioning: Finding the White Space",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 20,
              isPreview: true,
            },
            {
              title: "Competitive Landscape Analysis",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Defining Brand Voice, Values & Mission",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Writing a Professional Brand Brief",
              position: 5,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 20,
              isPreview: false,
            },
          ],
        },
        {
          title: "Visual Identity Design",
          position: 2,
          lessons: [
            {
              title: "Logo Design Principles: Timeless vs Trendy",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Wordmarks, Lettermarks & Symbol Marks",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Typography Systems for Brand Identity",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Colour Theory & Brand Palette Construction",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Iconography, Illustration Style & Brand Texture",
              position: 5,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 18,
              isPreview: false,
            },
          ],
        },
        {
          title: "Brand Guidelines & Rollout",
          position: 3,
          lessons: [
            {
              title: "Building a Comprehensive Brand Guide",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Digital Applications: Web, App & Social Media",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Print Applications: Stationery, Packaging & OOH",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Maintaining Brand Consistency Across Teams",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 16,
              isPreview: false,
            },
          ],
        },
        {
          title: "Real Brand Projects & Client Presentation",
          position: 4,
          lessons: [
            {
              title: "Project: Tech Startup Brand Identity",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 36,
              isPreview: false,
            },
            {
              title: "Project: Consumer Goods — Packaging & Brand System",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 34,
              isPreview: false,
            },
            {
              title: "Presenting a Brand Identity to Clients",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Pricing, Contracts & Running a Brand Studio",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=v2tBMiJBj70",
              duration: 20,
              isPreview: false,
            },
          ],
        },
      ],
    },
    brandCat.id,
    ayomide.id
  );

  // ── 6. AI Product Engineering ─────────────────────────────────────────────────
  await seedCourse(
    {
      title: "AI Product Engineering: Build & Ship LLM-Powered Apps",
      slug: "ai-product-engineering",
      description: `The most practical AI engineering course available in 2026. You will build production-grade AI features using the APIs and frameworks that real startups and engineering teams are shipping with today — Anthropic Claude, OpenAI, LangChain, LangGraph, and vector databases.

No theoretical fluff. Every module ends with a working system you can deploy. You will build a document Q&A system, an AI-powered customer support agent, a multi-step autonomous workflow, and a streaming chat interface — all production-ready.

This course is taught by a YC-backed AI engineer who has shipped AI features to 500,000+ users. He teaches the things nobody else tells you: cost management, evaluation, failure modes, and what actually works in production.`,
      shortDesc:
        "Build production LLM apps — RAG pipelines, AI agents, streaming chat, and real deployment.",
      thumbnail: "https://img.youtube.com/vi/kCc8FmEb1nY/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
      difficulty: "INTERMEDIATE",
      previewCount: 2,
      requirements: [
        "Comfortable with JavaScript or Python (either is fine — we use TypeScript for web and Python for ML components)",
        "Basic understanding of REST APIs",
        "A computer with internet access",
        "No prior AI or ML experience required",
      ],
      includes: [
        "20 hours on-demand video",
        "4 complete AI systems built from scratch",
        "Downloadable code for every project",
        "Certificate of completion",
      ],
      modules: [
        {
          title: "The Modern AI Stack in 2026",
          position: 1,
          lessons: [
            {
              title: "The Landscape: Foundation Models, APIs & Agents",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 16,
              isPreview: true,
            },
            {
              title: "Choosing the Right Model: Cost, Speed & Capability Trade-offs",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 20,
              isPreview: true,
            },
            {
              title: "API-First vs Fine-Tuning: When to Use Which",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Setting Up Your AI Development Environment",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 14,
              isPreview: false,
            },
          ],
        },
        {
          title: "Prompt Engineering & LLM Fundamentals",
          position: 2,
          lessons: [
            {
              title: "How LLMs Actually Work: Tokens, Context & Temperature",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Prompt Engineering: System Prompts & Role Play",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Few-Shot Prompting & Chain-of-Thought Reasoning",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Structured Outputs, JSON Mode & Tool Use",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Evaluating LLM Quality: Evals, Benchmarks & Human Review",
              position: 5,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 20,
              isPreview: false,
            },
          ],
        },
        {
          title: "RAG: Retrieval-Augmented Generation",
          position: 3,
          lessons: [
            {
              title: "What is RAG and Why Does it Work?",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Vector Embeddings & Semantic Search",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Setting Up Pinecone & pgvector",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Project: Document Q&A System — End to End",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 40,
              isPreview: false,
            },
          ],
        },
        {
          title: "AI Agents & Multi-Step Workflows",
          position: 4,
          lessons: [
            {
              title: "What are AI Agents? The Execution Loop",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Tool Use & Function Calling in Depth",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Building a Multi-Step Agent with LangGraph",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 36,
              isPreview: false,
            },
            {
              title: "Guardrails, Fallbacks & Responsible AI Patterns",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 22,
              isPreview: false,
            },
          ],
        },
        {
          title: "Shipping AI to Production",
          position: 5,
          lessons: [
            {
              title: "Streaming Responses in a Next.js App",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 26,
              isPreview: false,
            },
            {
              title: "LLM Cost Management & Token Optimisation",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Observability: Logging, Traces & LLM Monitoring",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Deploying AI Apps on Vercel, Railway & Fly.io",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=kCc8FmEb1nY",
              duration: 20,
              isPreview: false,
            },
          ],
        },
      ],
    },
    aiEngCat.id,
    barry.id
  );

  // ── 7. Motion Design & Animation ──────────────────────────────────────────────
  await seedCourse(
    {
      title: "Motion Design & Animation: From Still to Story",
      slug: "motion-design-animation",
      description: `A professional motion design course for visual designers and creative professionals in 2026. You will master the craft of animation — from the 12 principles of animation through kinetic typography, logo reveals, UI micro-interactions, and full brand motion systems in After Effects.

Motion design is now an expected skill for senior brand and product designers. This course will make it your competitive advantage. You will build five motion projects throughout the course, each production-ready for client delivery or your portfolio.

No prior animation experience is required — just a willingness to think in time as well as space.`,
      shortDesc:
        "Master motion design and After Effects — from animation principles to brand motion systems.",
      thumbnail: "https://img.youtube.com/vi/oKIZp0dL8ik/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
      difficulty: "BEGINNER",
      previewCount: 2,
      requirements: [
        "Basic design knowledge (understanding of typography, colour, layout)",
        "Access to Adobe After Effects (subscription or trial)",
        "A computer capable of running After Effects",
        "No animation or motion experience required",
      ],
      includes: [
        "15 hours on-demand video",
        "5 motion design projects with source files",
        "Downloadable AE project files & motion templates",
        "Certificate of completion",
      ],
      modules: [
        {
          title: "The Language of Motion",
          position: 1,
          lessons: [
            {
              title: "The 12 Principles of Animation",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 18,
              isPreview: true,
            },
            {
              title: "Timing, Pacing & Emotional Weight",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 16,
              isPreview: true,
            },
            {
              title: "Motion Design vs Motion Graphics: When to Use Each",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 14,
              isPreview: false,
            },
            {
              title: "Building Your Creative Workspace in After Effects",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 16,
              isPreview: false,
            },
          ],
        },
        {
          title: "After Effects Core Skills",
          position: 2,
          lessons: [
            {
              title: "Interface Tour, Panels & Workflow Setup",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Keyframes, the Timeline & Graph Editor",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Easing & Motion Curves: The Craft of Feel",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Shape Layers & Path Animations",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Masking, Track Mattes & Parenting",
              position: 5,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 24,
              isPreview: false,
            },
          ],
        },
        {
          title: "Typography & Logo Animation",
          position: 3,
          lessons: [
            {
              title: "Kinetic Typography: Animating Text That Speaks",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 28,
              isPreview: false,
            },
            {
              title: "Logo Reveal: Draw-On & Build Techniques",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 30,
              isPreview: false,
            },
            {
              title: "Animated Lower-Thirds & Title Cards",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 24,
              isPreview: false,
            },
          ],
        },
        {
          title: "UI Micro-Animations & Brand Motion",
          position: 4,
          lessons: [
            {
              title: "UI Micro-Interactions: Buttons, Loaders & Transitions",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 28,
              isPreview: false,
            },
            {
              title: "Social Media Motion Graphics: Reels & Stories",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 30,
              isPreview: false,
            },
            {
              title: "Building a Brand Motion System",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 34,
              isPreview: false,
            },
            {
              title: "Exporting, Codecs & Delivering Motion Assets",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=oKIZp0dL8ik",
              duration: 16,
              isPreview: false,
            },
          ],
        },
      ],
    },
    motionCat.id,
    ayomide.id
  );

  // ── 8. Advanced React & Next.js ───────────────────────────────────────────────
  await seedCourse(
    {
      title: "Advanced React & Next.js: Patterns for Production",
      slug: "advanced-react-nextjs",
      description: `A senior-level engineering course for developers who already know React and Next.js and want to build at the standard of world-class product teams. This course goes deep on the patterns, architecture decisions, and operational knowledge that separate hobby projects from production systems.

You will cover advanced component patterns, performance optimisation, complex state management, testing strategy at scale, monorepo architecture, and the infrastructure that supports large Next.js applications. Every lesson is grounded in real engineering problems — not toy examples.

Taught by a former Stripe staff engineer who has worked on systems serving millions of daily active users.`,
      shortDesc:
        "Senior-level React & Next.js — architecture, performance, testing, and production infrastructure.",
      thumbnail: "https://img.youtube.com/vi/Tn6-PIqc4UM/maxresdefault.jpg",
      promoVideo: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
      difficulty: "ADVANCED",
      previewCount: 2,
      requirements: [
        "Comfortable building full-stack apps with React and Next.js",
        "Working knowledge of TypeScript",
        "Experience with Prisma or another ORM",
        "Familiar with REST APIs and basic database concepts",
      ],
      includes: [
        "18 hours on-demand video",
        "Production-grade starter repository",
        "Downloadable architecture diagrams & decision guides",
        "Certificate of completion",
      ],
      modules: [
        {
          title: "Advanced React Patterns",
          position: 1,
          lessons: [
            {
              title: "Compound Components & Render Props at Scale",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: true,
            },
            {
              title: "Inversion of Control: Slots & Headless Components",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 24,
              isPreview: true,
            },
            {
              title: "Custom Hook Library: Patterns & Pitfalls",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 26,
              isPreview: false,
            },
            {
              title: "React Concurrent Features: Suspense, useTransition & useDeferredValue",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 28,
              isPreview: false,
            },
          ],
        },
        {
          title: "Performance Engineering",
          position: 2,
          lessons: [
            {
              title: "React Profiler & Performance Debugging Workflow",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Memoisation: memo, useMemo & useCallback — When They Help",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Virtualization: Rendering 100k Rows Without Freezing",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 20,
              isPreview: false,
            },
            {
              title: "Bundle Analysis, Code Splitting & Lazy Loading",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
          ],
        },
        {
          title: "State Management at Scale",
          position: 3,
          lessons: [
            {
              title: "State Architecture: Local, Server & Global",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
            {
              title: "TanStack Query: Caching, Invalidation & Optimistic Updates",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 28,
              isPreview: false,
            },
            {
              title: "Zustand: Scalable Stores Without Boilerplate",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Real-Time State with WebSockets & Server-Sent Events",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 26,
              isPreview: false,
            },
          ],
        },
        {
          title: "Testing Strategy at Scale",
          position: 4,
          lessons: [
            {
              title: "Testing Philosophy: What to Test and What Not To",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 18,
              isPreview: false,
            },
            {
              title: "Testing Library Patterns for Complex UIs",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Visual Regression Testing with Chromatic",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 20,
              isPreview: false,
            },
            {
              title: "E2E Testing Strategy: Critical Paths vs Full Coverage",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
          ],
        },
        {
          title: "Production Infrastructure & Observability",
          position: 5,
          lessons: [
            {
              title: "Database Patterns: Connection Pooling, Read Replicas & Migrations",
              position: 1,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 26,
              isPreview: false,
            },
            {
              title: "Caching Architecture: Redis, CDN & Next.js ISR",
              position: 2,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 24,
              isPreview: false,
            },
            {
              title: "Observability: OpenTelemetry, Sentry & Structured Logging",
              position: 3,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 22,
              isPreview: false,
            },
            {
              title: "Incident Management: On-Call Runbooks & Post-Mortems",
              position: 4,
              videoUrl: "https://www.youtube.com/watch?v=Tn6-PIqc4UM",
              duration: 20,
              isPreview: false,
            },
          ],
        },
      ],
    },
    webDevCat.id,
    chisom.id
  );

  console.log("Seeding achievements...");
  const defaultAchievements = [
    {
      name: "First Step",
      description: "Complete your first lesson",
      icon: "CheckCircle",
      triggerType: "LESSON_COUNT",
      threshold: 1,
      role: "LEARNER",
    },
    {
      name: "Curious Mind",
      description: "Complete 5 lessons on the platform",
      icon: "BookOpen",
      triggerType: "LESSON_COUNT",
      threshold: 5,
      role: "LEARNER",
    },
    {
      name: "7-Day Streak",
      description: "Learn or teach for 7 consecutive days",
      icon: "Flame",
      triggerType: "STREAK_DAYS",
      threshold: 7,
      role: "HYBRID",
    },
    {
      name: "30-Day Streak",
      description: "Learn or teach for 30 consecutive days",
      icon: "Zap",
      triggerType: "STREAK_DAYS",
      threshold: 30,
      role: "HYBRID",
    },
    {
      name: "Course Completer",
      description: "Complete any course fully",
      icon: "Award",
      triggerType: "COURSE_COMPLETE",
      threshold: 1,
      role: "LEARNER",
    },
    {
      name: "First Student",
      description: "Get your first student enrolled in a course",
      icon: "UserPlus",
      triggerType: "STUDENT_COUNT",
      threshold: 1,
      role: "CREATOR",
    },
    {
      name: "Rising Star",
      description: "Get 50 students enrolled across your courses",
      icon: "Sparkles",
      triggerType: "STUDENT_COUNT",
      threshold: 50,
      role: "CREATOR",
    },
    {
      name: "Century",
      description: "Get 100 students enrolled across your courses",
      icon: "Trophy",
      triggerType: "STUDENT_COUNT",
      threshold: 100,
      role: "CREATOR",
    },
    {
      name: "Published",
      description: "Publish your first course successfully",
      icon: "Globe",
      triggerType: "PUBLISH_COURSE",
      threshold: 1,
      role: "CREATOR",
    },
  ];

  for (const ach of defaultAchievements) {
    await db.achievement.upsert({
      where: { name: ach.name },
      update: {
        description: ach.description,
        icon: ach.icon,
        triggerType: ach.triggerType as any,
        threshold: ach.threshold,
        role: ach.role as any,
      },
      create: ach as any,
    });
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
