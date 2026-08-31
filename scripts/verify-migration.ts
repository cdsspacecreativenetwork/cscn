import { db } from "../lib/db";

async function verify() {
  console.log("🔍 Running Database Migration Verification Check...\n");

  const totalUsers = await db.user.count();
  const totalProfiles = await db.profile.count();
  const totalLearnerProfiles = await db.learnerProfile.count();
  const totalInstructorProfiles = await db.instructorProfile.count();
  const totalMentorProfiles = await db.mentorProfile.count();
  const totalAdminPermissions = await db.adminPermission.count();
  const totalUserSecurities = await db.userSecurity.count();
  const totalPayoutConfigs = await db.payoutConfig.count();

  console.log("📊 Summary Table Record Counts:");
  console.log(`- Users: ${totalUsers}`);
  console.log(`- Profiles: ${totalProfiles}`);
  console.log(`- LearnerProfiles: ${totalLearnerProfiles}`);
  console.log(`- InstructorProfiles: ${totalInstructorProfiles}`);
  console.log(`- MentorProfiles: ${totalMentorProfiles}`);
  console.log(`- AdminPermissions: ${totalAdminPermissions}`);
  console.log(`- UserSecurities: ${totalUserSecurities}`);
  console.log(`- PayoutConfigs: ${totalPayoutConfigs}`);

  console.log("\n👤 Sample User Record with Relations:");
  const sampleUser = await db.user.findFirst({
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

  if (sampleUser) {
    console.log(`ID: ${sampleUser.id}`);
    console.log(`Email: ${sampleUser.email}`);
    console.log(`Role: ${sampleUser.role}`);
    console.log(`Profile Bio: ${sampleUser.profile?.bio ?? "None"}`);
    console.log(`Learner Streak: ${sampleUser.learnerProfile?.currentStreak ?? 0}`);
    console.log(`Instructor Enabled: ${sampleUser.instructorProfile?.isEnabled ?? false}`);
  }

  console.log("\n✅ Verification check complete!");
}

verify()
  .catch(console.error)
  .finally(() => db.$disconnect());
