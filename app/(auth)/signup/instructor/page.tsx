import React from "react";

import { CreateAccountScreen } from "@/components/auth/CreateAccountScreen";

export default function InstructorSignupPage() {
  return (
    <React.Suspense fallback={null}>
      <CreateAccountScreen variant="instructor" />
    </React.Suspense>
  );
}
