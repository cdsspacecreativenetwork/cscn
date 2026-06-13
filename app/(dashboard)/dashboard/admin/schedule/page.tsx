import { redirect } from "next/navigation";

export default function AdminScheduleRedirectPage() {
  redirect("/dashboard/admin/platform-events");
}
