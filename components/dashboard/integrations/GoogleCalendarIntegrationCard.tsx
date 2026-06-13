"use client";

import Image from "next/image";
import { ArrowUpRight, CalendarCheck2, CheckCircle2, Clock3, PlugZap, RefreshCw, ShieldCheck } from "lucide-react";
import { SiGooglecalendar } from "react-icons/si";

import { disconnectGoogleCalendarAction } from "@/actions/integrations";
import Button from "@/components/ui/Button";

type GoogleCalendarStatus = {
  connected: boolean;
  email: string | null;
  status: string | null;
  connectedAt: string | null;
};

export function GoogleCalendarIntegrationCard({
  status,
  returnTo = "/dashboard/settings?tab=Integrations",
}: {
  status: GoogleCalendarStatus;
  returnTo?: string;
}) {
  const connectHref = `/api/integrations/google-calendar/connect?returnTo=${encodeURIComponent(returnTo)}`;
  const capabilities = [
    { label: "Generate Google Meet links", icon: CalendarCheck2 },
    { label: "Create host calendar events", icon: Clock3 },
    { label: "Prepare mentor availability checks", icon: ShieldCheck },
  ];

  return (
    <section className="overflow-hidden rounded-[18px] border border-[#E3E8F4] bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-start md:justify-between md:p-6">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] border border-[#E3E8F4] bg-[#F4F6FB] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Image
              src="/assets/dashboard/flat-color-icons_google.svg"
              alt="Google"
              width={30}
              height={30}
              className="h-8 w-8"
            />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[18px] font-extrabold tracking-tight text-[#040B37]">Google Calendar</h3>
            </div>
            <p className="mt-2 max-w-[680px] text-[13px] font-semibold leading-[1.75] text-[#8F9BAD]">
              Connect Google Calendar in ordeer to manage events and reminders.
            </p>

            {status.connected && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <p className="inline-flex max-w-full items-center gap-2 rounded-[12px] bg-[#F4F6FB] px-3 py-2 text-[12px] font-extrabold text-[#4B5563]">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="truncate">{status.email || "Google Calendar connected"}</span>
                </p>
                {status.connectedAt && (
                  <p className="text-[11px] font-bold text-[#9CA3AF]">
                    Connected {new Date(status.connectedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
          {status.connected ? (
            <>
              <a
                href={connectHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-[#D8E0EF] bg-white px-4 text-[13px] font-extrabold text-[#040B37] transition hover:border-[#1C4ED1] hover:text-[#1C4ED1]"
              >
                <RefreshCw size={14} strokeWidth={1.9} />
                Reconnect
              </a>
              <form action={disconnectGoogleCalendarAction}>
                <Button type="submit" variant="outline" rounded="md" size="sm" className="h-11 border-red-200 text-red-600 hover:border-red-300 hover:text-red-700">
                  Disconnect
                </Button>
              </form>
            </>
          ) : (
            <a
              href={connectHref}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1C4ED1] to-[#0A7CFF] px-4 text-[13px] font-extrabold text-white shadow-[0_12px_26px_rgba(28,78,209,0.22)] transition hover:-translate-y-0.5"
            >
              <PlugZap size={15} strokeWidth={1.9} />
              Connect Google Calendar
              <ArrowUpRight size={14} strokeWidth={1.9} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
