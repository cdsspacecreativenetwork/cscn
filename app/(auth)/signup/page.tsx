import React from "react";

import { CreateAccountScreen } from "@/components/auth/CreateAccountScreen";

export default function SignupPage() {
  return (
    <React.Suspense fallback={null}>
      <CreateAccountScreen variant="learner" />
    </React.Suspense>
  );
}
