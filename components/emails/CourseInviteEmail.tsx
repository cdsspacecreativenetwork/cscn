import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";

interface Props {
  inviteLink: string;
  courseTitle: string;
  role: string;
  inviterName?: string;
}

const ROLE_LABELS: Record<string, string> = {
  CO_INSTRUCTOR: "Co-Instructor",
  TEACHING_ASSISTANT: "Teaching Assistant",
};

export const CourseInviteEmail = ({
  inviteLink,
  courseTitle,
  role,
  inviterName,
}: Props) => {
  const roleLabel = ROLE_LABELS[role] ?? role;
  return (
    <BaseLayout
      previewText={`You've been invited to co-instruct "${courseTitle}"`}
      heading={`You're invited as ${roleLabel}`}
    >
      <Section className="px-[20px]">
        <Text className="text-dark text-[16px] leading-[26px]">Hi there,</Text>
        <Text className="text-[#4B5563] text-[16px] leading-[26px] mt-[16px]">
          {inviterName ? `${inviterName} has` : "You have been"} invited you to join{" "}
          <strong>"{courseTitle}"</strong> on CSCN Academy as a {roleLabel}.
        </Text>
        <Section className="text-center mt-[32px] mb-[32px]">
          <Button
            className="bg-brand rounded-[10px] text-white text-[16px] font-bold no-underline text-center px-10 py-4 shadow-lg"
            href={inviteLink}
          >
            Accept Invite
          </Button>
        </Section>
        <Text className="text-[#4B5563] text-[14px] leading-[24px]">
          Or copy and paste:{" "}
          <br />
          <span className="text-brand break-all">{inviteLink}</span>
        </Text>
        <Text className="text-[#4B5563] text-[14px] leading-[24px] mt-[24px]">
          This invite link expires in 7 days. If you didn't expect this, you can ignore it.
        </Text>
      </Section>
    </BaseLayout>
  );
};
