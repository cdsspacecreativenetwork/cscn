'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, GraduationCap, Home, Map, UsersRound } from 'lucide-react';

import Footer from '@/components/marketing/Footer';
import Navbar from '@/components/marketing/Navbar';
import Button from '@/components/ui/Button';

const paths = [
  { label: 'Courses', href: '/courses', note: 'Find a class', Icon: BookOpen },
  { label: 'Mentorship', href: '/mentorship', note: 'Book a guide', Icon: GraduationCap },
  { label: 'Community', href: '/community', note: 'See the network', Icon: UsersRound },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex flex-1 items-center px-4 py-[7.5rem] md:py-[9rem]">
        <section className="mx-auto grid w-full max-w-[83rem] gap-10 lg:grid-cols-[1fr_420px] lg:items-center lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-primary">
              404 / route missing
            </p>
            <h1 className="mt-5 max-w-[760px] text-[44px] font-semibold leading-[1.04] tracking-tight text-navy sm:text-[64px] lg:text-[76px]">
              Looks like this path has not been mapped yet.
            </h1>
            <p className="mt-6 max-w-[620px] text-[16px] font-medium leading-[1.75] text-text-body sm:text-[18px]">
              The page may have moved, the link may be old, or the profile/resource is not public. Choose a reliable route below and keep going.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row max-w-1/2">
              <Button
                type="submit"
                variant="gradient"
                rounded="full"
                onClick={() => window.location.href = '/'}
                leftIcon={<Home size={18} />}
                className="w-full"
              >
                Go home
              </Button>
              <Button
                type="submit"
                variant="gradient"
                rounded="full"
                onClick={() => window.location.href = '/'}
                leftIcon={<ArrowRight size={18} />}
                className="w-full"
              >
                Browse courses
              </Button>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[24px] border border-[#C8D1E0] bg-white p-4 shadow-[0_24px_70px_rgba(4,11,55,0.08)]"
          >
            <div className="rounded-[18px] bg-[#F4F6FB] p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-primary text-white">
                  <Map size={24} />
                </div>
                <span className="text-[56px] font-semibold leading-none tracking-tight text-[#D8E0EE]">
                  404
                </span>
              </div>

              <div className="mt-10 space-y-3">
                {paths.map(({ label, href, note, Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex items-center justify-between rounded-[16px] border border-[#E3E8F4] bg-white p-4 transition hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(4,11,55,0.08)]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#EEF3FF] text-primary">
                        <Icon size={19} />
                      </span>
                      <span>
                        <span className="block text-[15px] font-semibold text-navy">{label}</span>
                        <span className="block text-[12px] font-medium text-text-mute">{note}</span>
                      </span>
                    </span>
                    <ArrowRight size={17} className="text-[#9CA3AF] transition group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                ))}
              </div>
            </div>
          </motion.aside>
        </section>
      </main>
    </div>
  );
}
