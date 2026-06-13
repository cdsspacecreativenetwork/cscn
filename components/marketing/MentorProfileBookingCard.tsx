"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import Button from "@/components/ui/Button";
import { MentorBookingPanel, type MentorBookingPanelData } from "@/components/marketing/MentorBookingPanel";

export function MentorProfileBookingCard({ mentor }: { mentor: MentorBookingPanelData }) {
  const [open, setOpen] = useState(false);
  const slots = mentor.slots ?? [];

  return (
    <>
      <div className="mt-6">
        <Button
          type="button"
          variant="primary"
          rounded="md"
          rightIcon={<ArrowRight size={16} />}
          onClick={() => setOpen(true)}
          className="w-full sm:w-auto"
          disabled={slots.length === 0}
        >
          {slots.length > 0 ? "Book a session" : "No mentorship slots yet"}
        </Button>
      </div>

      <MentorBookingPanel mentor={mentor} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
