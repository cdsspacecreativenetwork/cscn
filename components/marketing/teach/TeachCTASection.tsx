'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function TeachCTASection() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isPending, setIsPending] = useState(false);

  const handleGetStarted = async () => {
    if (isPending) return;
    setIsPending(true);

    try {
      if (status === 'unauthenticated') {
        window.location.assign('/signup?intent=INSTRUCTOR&callbackUrl=/instructor/onboarding');
        return;
      }

      await fetch('/api/onboarding/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: 'INSTRUCTOR' }),
      }).catch((err) => console.error('Intent save error:', err));

      router.push('/instructor/onboarding');
    } catch (err) {
      console.error('Error starting instructor flow:', err);
      router.push('/instructor/onboarding');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <section className="w-full bg-background">
      <div className="w-full max-w-[86rem] mx-auto px-4 sm:px-6 lg:px-12 py-20 sm:py-28 text-center flex flex-col items-center justify-center">
        <h2 className="text-3xl sm:text-[38px] font-semibold tracking-tight text-[#040B37] text-center mb-3">
          Become an instructor today
        </h2>
        <p className="text-base sm:text-lg text-[#4B5563] font-normal text-center max-w-xl mx-auto mb-8 leading-relaxed">
          Join one of the world’s leading technology and creative learning communities.
        </p>

        <Button
          variant="gradient"
          size="lg"
          rounded="full"
          hasBorder={true}
          disableScaleHover={true}
          loading={isPending}
          onClick={handleGetStarted}
          rightIcon={!isPending ? <ArrowRight size={18} /> : undefined}
          className="text-base font-bold text-white bg-[#1C4ED1]"
        >
          Get started
        </Button>
      </div>
    </section>
  );
}
