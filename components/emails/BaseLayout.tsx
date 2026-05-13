import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface BaseLayoutProps {
  previewText: string;
  heading: string;
  children: React.ReactNode;
}

export const BaseLayout = ({
  previewText,
  heading,
  children,
}: BaseLayoutProps) => {
  const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#1C4ED1",
                dark: "#040B37",
                gray: "#9CA3AF",
              },
            },
          },
        }}
      >
        <Body className="bg-[#f4f6fb] my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#e3e8f4] rounded-[16px] my-[40px] mx-auto p-[40px] max-w-[600px] bg-white shadow-xl">
            <Section className="mt-[32px]">
              <Img
                src={`${url}/assets/images/logo.svg`} 
                width="120"
                height="auto"
                alt="CSCN Logo"
                className="mx-auto"
              />
            </Section>
            <Heading className="text-dark text-[24px] font-bold text-center p-0 my-[30px] mx-0">
              {heading}
            </Heading>
            {children}
            <Hr className="border border-solid border-[#e3e8f4] my-[26px] mx-0 w-full" />
            <Section className="text-center">
              <Text className="text-gray text-[12px] leading-[24px]">
                &copy; {new Date().getFullYear()} CSCN Academy. All rights reserved.
                <br /> Nigeria.
              </Text>
              <Section className="mt-4">
                <Link href={`${url}/`} className="text-brand text-[12px] mx-2 underline font-bold">
                  Website
                </Link>
                <Link href={`${url}/terms/`} className="text-brand text-[12px] mx-2 underline font-bold">
                  Terms
                </Link>
                <Link href={`${url}/privacy/`} className="text-brand text-[12px] mx-2 underline font-bold">
                  Privacy
                </Link>
              </Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
