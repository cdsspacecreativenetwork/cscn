import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { getPostAuthRedirect } from "@/lib/post-auth-redirect";

export default async function AuthContinuePage() {
  const user = await currentUser();

  if (!user?.id) {
    redirect("/signin");
  }

  redirect(await getPostAuthRedirect(user.id));
}

