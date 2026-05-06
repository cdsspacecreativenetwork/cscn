'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export default function CommunityCTA() {
  return (
    <section className="py-24 bg-white px-4 md:px-0">
      <div className="container max-w-[1200px]">
        <div className="bg-navy rounded-[32px] p-10 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-[700px] flex flex-col items-center gap-8"
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl md:text-[3.5rem] font-semibold text-white leading-[1.1] tracking-tight font-inter">
                Join the CSCN Community
              </h2>
              <p className="text-lg text-[#E3E8F4] font-medium font-inter opacity-80 leading-relaxed">
                Stay updated with new courses, industry insights, and exclusive design resources delivered straight to your inbox.
              </p>
            </div>

            <div className="w-full max-w-[500px]">
              <form className="flex flex-col sm:flex-row gap-3 w-full" onSubmit={(e) => e.preventDefault()}>
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all flex-grow font-inter"
                  required
                />
                <button className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg whitespace-nowrap">
                  Join Now
                </button>
              </form>
              <p className="text-[12px] text-white/40 mt-4 font-inter">
                By joining, you agree to our Privacy Policy and Terms of Service.
              </p>
            </div>
          </motion.div>

          {/* Abstract Objects - Match Figma nodes if available */}
          <div className="absolute top-10 left-10 opacity-20 pointer-events-none hidden md:block">
             <div className="w-20 h-20 border-2 border-white/20 rounded-full" />
          </div>
          <div className="absolute bottom-10 right-10 opacity-20 pointer-events-none hidden md:block">
             <div className="w-32 h-32 border border-white/10 rotate-45" />
          </div>
        </div>
      </div>
    </section>
  );
}
