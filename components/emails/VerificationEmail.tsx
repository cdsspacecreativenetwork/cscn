import {
  Button,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { BaseLayout } from "./BaseLayout";

interface VerificationEmailProps {
  confirmLink: string;
  userName?: string;
}

export const VerificationEmail = ({
  confirmLink,
  userName = "Learner",
}: VerificationEmailProps) => {
  return (
    <BaseLayout 
      previewText="Verify your email to unlock full access to CSCN"
      heading="Welcome to CSCN Academy! 👋"
    >
      <Section className="px-[20px]">
        <Text className="text-dark text-[16px] leading-[26px]">
          Hi {userName},
        </Text>
        <Text className="text-[#4B5563] text-[16px] leading-[26px] mt-[16px]">
          We&apos;re excited to have you on board. To ensure the security of your account and
          unlock full access to certificates, exams, and career resources, please verify 
          your email address by clicking the button below:
        </Text>
        <Section className="text-center mt-[32px] mb-[32px]">
          <Button
            style={{
              backgroundColor: "#1C4ED1",
              borderRadius: "10px",
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
              textAlign: "center",
              textDecoration: "none",
              padding: "16px 40px",
            }}
            href={confirmLink}
          >
            Verify Email Address
          </Button>
        </Section>
        <Text className="text-[#4B5563] text-[14px] leading-[24px]">
          Or copy and paste this URL into your browser:{" "}
          <br />
          <span className="text-brand break-all">{confirmLink}</span>
        </Text>
        <Text className="text-[#4B5563] text-[16px] leading-[26px] mt-[32px]">
          If you didn&apos;t create an account, you can safely ignore this email.
        </Text>
      </Section>
    </BaseLayout>
  );
};
