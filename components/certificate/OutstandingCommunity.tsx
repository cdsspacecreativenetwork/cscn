'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import Button from '@/components/ui/Button';
import type { CertificateCommunityMember } from '@/data/certificate-community';

const ROW_SEQUENCE = [3, 6, 10, 6];
const STREAM_ROW_COUNT = 17;

type Props = {
  members: CertificateCommunityMember[];
};

function hashValue(value: string) {
  return Array.from(value).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function shuffleMembers(members: CertificateCommunityMember[], seed: number) {
  return [...members].sort((a, b) => {
    const aScore = hashValue(`${a.id}-${seed}`);
    const bScore = hashValue(`${b.id}-${seed}`);
    return aScore - bScore;
  });
}

function getRowCount(rowIndex: number) {
  if (rowIndex === 0) return 3;
  return ROW_SEQUENCE[(rowIndex - 1) % ROW_SEQUENCE.length];
}

function buildRows(members: CertificateCommunityMember[]) {
  if (members.length === 0) return [];
  const shuffled = shuffleMembers(members, 11);
  let cursor = 0;

  return Array.from({ length: STREAM_ROW_COUNT }, (_, rowIndex) => {
    const count = getRowCount(rowIndex);
    const row: CertificateCommunityMember[] = [];

    for (let index = 0; index < count; index++) {
      let next = shuffled[cursor % shuffled.length];
      const previous = row[row.length - 1];

      if (previous?.id === next.id && shuffled.length > 1) {
        cursor += 1;
        next = shuffled[cursor % shuffled.length];
      }

      row.push(next);
      cursor += 1 + ((rowIndex + index) % Math.max(1, shuffled.length - 1));
    }

    return row;
  });
}

export const OutstandingCommunity = ({ members }: Props) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const rows = useMemo(() => buildRows(members), [members]);
  const streamRows = useMemo(() => [...rows, ...rows], [rows]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (window.localStorage.getItem('cscn_certificate_community_confetti_seen')) {
          observer.disconnect();
          return;
        }

        window.localStorage.setItem('cscn_certificate_community_confetti_seen', 'true');
        const rect = node.getBoundingClientRect();
        const origin = {
          x: Math.min(0.9, Math.max(0.1, (rect.left + rect.width / 2) / window.innerWidth)),
          y: Math.min(0.85, Math.max(0.15, (rect.top + rect.height * 0.42) / window.innerHeight)),
        };
        const colors = ['#0035C1', '#0575FF', '#10B981', '#F59E0B', '#FFFFFF'];

        confetti({
          particleCount: 180,
          spread: 110,
          startVelocity: 48,
          scalar: 1.15,
          ticks: 220,
          origin,
          colors,
        });
        window.setTimeout(() => {
          confetti({
            particleCount: 130,
            spread: 82,
            startVelocity: 40,
            scalar: 1,
            ticks: 200,
            origin: { ...origin, y: Math.min(0.9, origin.y + 0.04) },
            colors,
          });
        }, 180);
        observer.disconnect();
      },
      { threshold: 0.42 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const renderAvatar = (member: CertificateCommunityMember, index: number, row: number) => (
    <Link
      key={`${member.id}-${row}-${index}`}
      href={member.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`View ${member.name}'s profile`}
      className="relative h-[38px] w-[38px] shrink-0 overflow-hidden rounded-full shadow-[0_8px_20px_rgba(4,11,55,0.12)] transition-all duration-300 hover:z-20 hover:scale-110 hover:shadow-[0_12px_28px_rgba(28,78,209,0.24)] sm:h-12 sm:w-12 lg:h-14 lg:w-14"
    >
      <Image
        src={member.image}
        alt={member.name}
        fill
        className="object-cover"
        sizes="56px"
        unoptimized
      />
    </Link>
  );

  return (
    <section ref={sectionRef} className="relative z-10 flex w-full flex-col items-center overflow-hidden bg-[#F4F6FB] py-20 lg:py-28">
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[10%] top-[10%] h-[137px] w-[400px] rounded-full bg-[#0575FF] opacity-15 blur-[100px] lg:w-[587px]" />
        <div className="absolute right-[10%] bottom-[20%] h-[137px] w-[400px] rounded-full bg-[#0035C1] opacity-15 blur-[100px] lg:w-[587px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-[1440px] flex-col items-center gap-10 px-5 md:px-12 lg:gap-12 lg:px-[160px]">
        <div className="flex w-full max-w-[656px] flex-col items-center gap-3 text-center">
          <h2 className="text-[30px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#040B37] md:text-[40px]">
            Outstanding Community
          </h2>
          <p className="text-sm font-medium leading-[1.55] tracking-[-0.01em] text-[#4B5563] md:text-base">
            We celebrate members of our community who have gone the extra mile to earn their certificate through dedication, consistency, and exceptional work.
          </p>
        </div>

        <div className="relative h-[260px] w-full max-w-[980px] overflow-hidden bg-transparent sm:h-[300px] lg:h-[330px]">
          {members.length > 0 ? (
            <div
              className="h-full overflow-hidden"
              style={{
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
              }}
            >
              <div className="community-avatar-stream flex flex-col items-center gap-5 py-3 sm:gap-6">
                {streamRows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex min-w-max items-center justify-center gap-3 sm:gap-5 lg:gap-6"
                  >
                    {row.map((member, index) => renderAvatar(member, index, rowIndex))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[24px] px-6 text-center text-sm font-semibold text-[#9CA3AF]">
              Community members will appear here as students and instructors complete their profiles.
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button
            variant="gradient"
            size="lg"
            rounded="full"
            hasBorder
            onClick={() => window.location.href = '/courses'}
            className="shadow-[0_12px_28px_rgba(28,78,209,0.24)]"
          >
            Start a course today
          </Button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes community-scroll-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .community-avatar-stream {
          animation: community-scroll-up 20s linear infinite;
        }
        .community-avatar-stream:hover {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .community-avatar-stream {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
};
