'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center pt-32 pb-24 px-6">
        <div className="container max-w-5xl text-center">
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Visual Header */}
            <div className="mb-10 flex justify-center">
              <div className="relative w-full max-w-[420px] aspect-[16/10]">
                <Image
                  src="/assets/404-corporate.png"
                  alt="404 Page Not Found"
                  fill
                  className="object-contain opacity-95"
                  priority
                />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-outfit font-bold text-navy mb-6 tracking-tight">
              We can't find the page you're looking for.
            </h1>
            <p className="text-xl text-text-body mb-12 max-w-2xl mx-auto leading-relaxed">
              Check out our help page or try searching below to find your next career-defining course.
            </p>

            {/* Search Experience - Central Utility */}
            <div className="max-w-2xl mx-auto mb-20">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Search for courses (e.g. UX Design)"
                  className="w-full pl-8 pr-36 py-6 bg-background border-2 border-stroke rounded-2xl text-lg font-medium focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all shadow-sm group-hover:border-stroke-ii"
                />
                <div className="absolute right-2.5 top-2.5 bottom-2.5">
                  <Button variant="primary" size="lg" className="h-full px-10 rounded-xl font-bold shadow-md">
                    Search
                  </Button>
                </div>
              </div>
            </div>

            {/* Helpful Alternatives */}
            <div className="mb-16">
              <h3 className="text-sm font-bold text-text-mute uppercase tracking-[0.2em] mb-8">
                Or browse our platform
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { name: 'All Courses', icon: '📚', path: '/courses', desc: 'Browse our full catalog' },
                  { name: 'Mentorship', icon: '🤝', path: '/mentorship', desc: 'Connect with experts' },
                  { name: 'Community', icon: '🌐', path: '/community', desc: 'Join the discussion' },
                  { name: 'Help Center', icon: '❓', path: '/help', desc: 'Get support & answers' },
                ].map((item) => (
                  <Link key={item.name} href={item.path} className="group">
                    <div className="h-full p-8 bg-white border border-stroke rounded-2xl transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:border-primary/20 group-hover:-translate-y-1 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center text-4xl mb-6 group-hover:bg-primary/5 transition-colors">
                        {item.icon}
                      </div>
                      <h4 className="font-bold text-navy text-lg mb-2">{item.name}</h4>
                      <p className="text-sm text-text-mute leading-snug">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Support Links */}
            {/* <div className="pt-10 border-t border-stroke flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-semibold text-text-body">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-2">
                <span>←</span> Back to Home
              </Link>
              <Link href="/signin" className="hover:text-primary transition-colors">Sign In</Link>
              <Link href="/contact" className="hover:text-primary transition-colors">Contact Support</Link>
              <Link href="/status" className="hover:text-primary transition-colors">Site Status</Link>
            </div> */}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
