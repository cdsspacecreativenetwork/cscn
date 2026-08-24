"use client";

import { useState } from "react";

import { startCohortCheckoutAction } from "@/actions/cohort-payments";
import Button from "@/components/ui/Button";

export function CohortOfferPaymentButton({ applicationId }: { applicationId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout() {
    setPending(true);
    setError(null);
    const result = await startCohortCheckoutAction(applicationId);
    if (result.authorizationUrl) {
      window.location.assign(result.authorizationUrl);
      return;
    }
    if (result.redirectUrl) {
      window.location.assign(result.redirectUrl);
      return;
    }
    setError(result.error ?? "Unable to start checkout.");
    setPending(false);
  }

  return (
    <div>
      <Button type="button" onClick={startCheckout} loading={pending} size="lg" className="w-full sm:w-auto">
        Complete secure payment
      </Button>
      {error && <p className="mt-3 text-sm font-semibold text-red-600" role="alert">{error}</p>}
    </div>
  );
}
