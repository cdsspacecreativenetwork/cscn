import { redirect } from "next/navigation";

export default function AdminLearnersRedirect() {
  redirect("/dashboard/admin/students");
}
