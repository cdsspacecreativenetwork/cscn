"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { updateDisplayCurrency } from "@/actions/settings";
import { CustomSelect } from "@/components/ui/CustomSelect";

const CURRENCY_OPTIONS = [
  { value: "NGN", label: "NGN - Nigerian Naira" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GHS", label: "GHS - Ghanaian Cedi" },
  { value: "KES", label: "KES - Kenyan Shilling" },
  { value: "ZAR", label: "ZAR - South African Rand" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
];

interface Props {
  value: string;
  className?: string;
  onPendingChange?: (pending: boolean) => void;
}

export function CurrencyPreferenceSelect({ value, className, onPendingChange }: Props) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className={className}>
      <CustomSelect
        value={value}
        disabled={pending}
        options={CURRENCY_OPTIONS}
        onChange={(next) => {
          if (next === value) return;
          onPendingChange?.(true);
          window.dispatchEvent(new CustomEvent("display-currency-pending", { detail: true }));
          startTransition(async () => {
            const result = await updateDisplayCurrency(next);
            if (result.error) {
              toast.error(result.error);
              onPendingChange?.(false);
              window.dispatchEvent(new CustomEvent("display-currency-pending", { detail: false }));
              return;
            }
            toast.success("Display currency updated.");
            router.refresh();
            window.setTimeout(() => {
              onPendingChange?.(false);
              window.dispatchEvent(new CustomEvent("display-currency-pending", { detail: false }));
            }, 700);
          });
        }}
      />
    </div>
  );
}
