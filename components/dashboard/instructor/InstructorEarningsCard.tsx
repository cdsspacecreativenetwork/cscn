"use client";

import { useTransition } from "react";
import { useState } from "react";
import { Banknote, Loader2, WalletCards } from "lucide-react";
import { toast } from "sonner";

import { requestInstructorPayoutAction } from "@/actions/billing";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/money";
import { CurrencyPreferenceSelect } from "@/components/dashboard/CurrencyPreferenceSelect";

interface Props {
  available: number;
  pending: number;
  threshold: number;
  currency?: string;
}

function formatMoney(amount: number, currency = "NGN") {
  return formatCurrency(amount, currency, "en-US");
}

export function InstructorEarningsCard({ available, pending, threshold, currency = "NGN" }: Props) {
  const [isPending, startTransition] = useTransition();
  const [isCurrencyUpdating, setIsCurrencyUpdating] = useState(false);
  const canWithdraw = available >= threshold;

  const requestPayout = () => {
    startTransition(async () => {
      const result = await requestInstructorPayoutAction();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Withdrawal request sent to finance.");
    });
  };

  return (
    <div className="rounded-[16px] border border-[#E3E8F4] bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-[#1C4ED1]/10 text-[#1C4ED1]">
            <WalletCards size={22} />
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.12em] text-[#1C4ED1]">Instructor earnings</p>
            {isCurrencyUpdating ? (
              <div className="mt-2 space-y-2">
                <div className="h-8 w-56 animate-pulse rounded-md bg-[#1C4ED1]/5" />
                <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-[#1C4ED1]/5" />
              </div>
            ) : (
              <>
                <h2 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[#040B37]">
                  {formatMoney(available, currency)} available
                </h2>
                <p className="mt-1 text-[13px] font-semibold text-[#9CA3AF]">
                  {formatMoney(pending, currency)} pending release. Withdrawals open from {formatMoney(threshold, currency)}.
                </p>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-[220px]">
            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-[#9CA3AF]">Display currency</p>
            <CurrencyPreferenceSelect value={currency} onPendingChange={setIsCurrencyUpdating} />
          </div>
          <Button
            type="button"
            size="sm"
            rounded="[10px]"
            hasBorder={false}
            disabled={!canWithdraw || isPending}
            onClick={requestPayout}
            leftIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Banknote size={16} />}
          >
            Request withdrawal
          </Button>
        </div>
      </div>
      {!canWithdraw && (
        <p className="mt-4 rounded-[10px] bg-[#1C4ED1]/5 px-4 py-3 text-[12px] font-bold text-[#1C4ED1]">
          You need {isCurrencyUpdating ? "..." : formatMoney(Math.max(0, threshold - available), currency)} more available earnings before requesting a payout.
        </p>
      )}
    </div>
  );
}
