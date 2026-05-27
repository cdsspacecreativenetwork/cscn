import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Starting DB update for modules and lessons using native PrismaClient in workspace...");

  // Update modules whose parent course is PUBLISHED
  const moduleUpdate = await db.module.updateMany({
    where: {
      course: {
        status: "PUBLISHED"
      }
    },
    data: {
      isPublished: true
    }
  });

  console.log(`Updated ${moduleUpdate.count} modules to isPublished: true.`);

  // Update lessons whose parent module's parent course is PUBLISHED
  const lessonUpdate = await db.lesson.updateMany({
    where: {
      module: {
        course: {
          status: "PUBLISHED"
        }
      }
    },
    data: {
      isPublished: true
    }
  });

  console.log(`Updated ${lessonUpdate.count} lessons to isPublished: true.`);
  console.log("DB update completed successfully!");
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
