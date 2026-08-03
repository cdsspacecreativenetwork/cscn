import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import ResourceLibraryClient from "@/components/dashboard/instructor/ResourceLibraryClient";

export default async function InstructorResourcesPage() {
  const user = await currentUser();
  if (!user?.id) return null;
  const [resources, courses] = await Promise.all([
    db.marketplaceResource.findMany({ where: { ownerId: user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, title: true, status: true, isFree: true, price: true, category: true, updatedAt: true } }),
    db.course.findMany({ where: { instructorId: user.id }, select: { id: true, title: true, modules: { orderBy: { position: "asc" }, select: { id: true, title: true, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true } } } } } }),
  ]);
  return <ResourceLibraryClient resources={resources} courses={courses} />;
}
