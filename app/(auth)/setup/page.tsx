import { redirect } from "next/navigation";
import { adminExists } from "@/data/user";
import { SetupForm } from "./SetupForm";

export default async function SetupPage() {
  const exists = await adminExists();

  if (exists) {
    redirect("/signin");
  }

  const requireSecret = !!process.env.SETUP_SECRET;

  return <SetupForm requireSecret={requireSecret} />;
}
