import { db } from "../lib/db";

async function fetchUsersWithRetry(retries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await db.user.findMany({
        include: {
          profile: true,
          learnerProfile: true,
          instructorProfile: true,
          mentorProfile: true,
          adminPermission: true,
          userSecurity: true,
          payoutConfig: true,
        },
      });
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt}/${retries} to fetch users failed. Retrying in ${delayMs / 1000}s...`);
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return [];
}

async function main() {
  console.log("🚀 Starting User relation verification & setup script...");

  const users = await fetchUsersWithRetry();
  console.log(`📊 Found ${users.length} total users in database.`);

  let profilesCreated = 0;
  let learnerProfilesCreated = 0;
  let instructorProfilesCreated = 0;
  let mentorProfilesCreated = 0;
  let adminPermissionsCreated = 0;
  let userSecuritiesCreated = 0;
  let payoutConfigsCreated = 0;

  for (const user of users) {
    try {
      // 1. Ensure Profile exists
      if (!user.profile) {
        await db.profile.create({
          data: {
            userId: user.id,
            publicProfileStatus: "DRAFT",
          },
        });
        profilesCreated++;
      }

      // 2. Ensure LearnerProfile exists
      if (!user.learnerProfile) {
        await db.learnerProfile.create({
          data: {
            userId: user.id,
            currentStreak: 0,
            longestStreak: 0,
          },
        });
        learnerProfilesCreated++;
      }

      // 3. Create InstructorProfile for INSTRUCTOR role if missing
      if (user.role === "INSTRUCTOR" && !user.instructorProfile) {
        await db.instructorProfile.create({
          data: {
            userId: user.id,
            isEnabled: true,
            verificationStatus: "PENDING",
          },
        });
        instructorProfilesCreated++;
      }

      // 4. Create AdminPermission for ADMIN role if missing
      if ((user.role === "ADMIN" || user.role === "SUPER_ADMIN") && !user.adminPermission) {
        await db.adminPermission.create({
          data: {
            userId: user.id,
            canManageUsers: true,
            canManageCourses: true,
            canReviewCourses: true,
            canPublishCourses: true,
            canManageLearners: true,
            canManageInstructors: true,
            canVerifyInstructors: true,
            canManageInvites: true,
            canManageAnnouncements: true,
            canManageBilling: true,
            canManageMarketing: true,
            canManagePermissions: true,
            canViewAuditLogs: true,
            canManageSettings: true,
            canViewAnalytics: true,
          },
        });
        adminPermissionsCreated++;
      }
    } catch (err) {
      console.error(`⚠️ Error migrating user ${user.id} (${user.email}):`, err);
    }
  }

  console.log("\n🎉 Migration & Setup Complete!");
  console.log(`- Profiles Ensured: ${profilesCreated}`);
  console.log(`- LearnerProfiles Ensured: ${learnerProfilesCreated}`);
  console.log(`- InstructorProfiles Ensured: ${instructorProfilesCreated}`);
  console.log(`- AdminPermissions Ensured: ${adminPermissionsCreated}`);

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Fatal Migration Error:", e);
  process.exit(1);
});
