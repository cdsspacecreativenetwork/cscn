import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { db } from "@/lib/db";
import { getVerificationTokenByToken } from "@/data/verification-token";

type VerificationPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function NewVerificationPage({ searchParams }: VerificationPageProps) {
  const tokenParam = (await searchParams).token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;

  let result: { success?: string; error?: string };

  if (!token) {
    result = { error: "This verification link is missing a token." };
  } else {
    const existingToken = await getVerificationTokenByToken(token);

    if (!existingToken) {
      result = { error: "This verification link is invalid or has already been used." };
    } else if (existingToken.expires < new Date()) {
      await db.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: existingToken.identifier,
            token: existingToken.token,
          },
        },
      });
      result = { error: "This verification link has expired. Please request a new one from your dashboard." };
    } else {
      const user = await db.user.findUnique({
        where: { email: existingToken.identifier },
        select: { id: true },
      });

      if (!user) {
        result = { error: "We could not find an account for this verification link." };
      } else {
        await Promise.all([
          db.user.update({
            where: { id: user.id },
            data: { emailVerified: new Date() },
          }),
          db.verificationToken.delete({
            where: {
              identifier_token: {
                identifier: existingToken.identifier,
                token: existingToken.token,
              },
            },
          }),
        ]);
        result = { success: "Your email has been verified successfully." };
      }
    }
  }

  const isSuccess = !!result.success;

  return (
    <AuthLayout
      title={isSuccess ? "Email verified" : "Verification failed"}
      subtitle={isSuccess ? "Your CSCN account is ready." : "We could not verify this email link."}
      sidebarTitle={isSuccess ? "You're good to go." : "Let's fix this."}
      sidebarSubtitle={
        isSuccess
          ? "You can now access certificates and the full course experience."
          : "Open your dashboard and request a fresh verification link."
      }
      showBackToHome={false}
    >
      <div className="space-y-8 text-center">
        <div className="flex flex-col items-center gap-4 py-6">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isSuccess ? "bg-green-50" : "bg-red-50"}`}>
            {isSuccess ? (
              <CheckCircle2 size={32} className="text-green-500" />
            ) : (
              <XCircle size={32} className="text-red-500" />
            )}
          </div>
          <p className="text-[15px] font-medium leading-relaxed text-[#4B5563]">
            {result.success ?? result.error}
          </p>
        </div>

        <Link
          href={isSuccess ? "/signin" : "/dashboard"}
          className="flex h-[56px] w-full items-center justify-center rounded-full bg-[#1C4ED1] text-[16px] font-semibold text-white transition-all hover:bg-[#163BB1]"
        >
          {isSuccess ? "Sign in" : "Back to dashboard"}
        </Link>
      </div>
    </AuthLayout>
  );
}
