import { Button, Section, Text } from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";

interface Props {
  resetLink: string;
  userName?: string;
}

export const PasswordResetEmail = ({ resetLink, userName = "Learner" }: Props) => (
  <BaseLayout previewText="Reset your CSCN password" heading="Reset Your Password">
    <Section className="px-[20px]">
      <Text className="text-dark text-[16px] leading-[26px]">Hi {userName},</Text>
      <Text className="text-[#4B5563] text-[16px] leading-[26px] mt-[16px]">
        We received a request to reset your password. Click the button below to choose a new one.
        This link expires in 1 hour.
      </Text>
      <Section className="text-center mt-[32px] mb-[32px]">
        <Button
          className="bg-brand rounded-[10px] text-white text-[16px] font-bold no-underline text-center px-10 py-4 shadow-lg"
          href={resetLink}
        >
          Reset Password
        </Button>
      </Section>
      <Text className="text-[#4B5563] text-[14px] leading-[24px]">
        Or copy and paste this URL:{" "}
        <br />
        <span className="text-brand break-all">{resetLink}</span>
      </Text>
      <Text className="text-[#4B5563] text-[16px] leading-[26px] mt-[32px]">
        If you didn't request a password reset, you can safely ignore this email.
      </Text>
    </Section>
  </BaseLayout>
);
