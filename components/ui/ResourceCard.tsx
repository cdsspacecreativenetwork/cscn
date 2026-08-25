'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Resource } from '@/lib/resources';
import Button from '@/components/ui/Button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

export default function ResourceCard({ title, price, label, image }: Resource) {
  const isFree = label === 'Free';
  const buttonText = isFree ? 'Download' : `Pay $${price}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className="group h-full w-full"
    >
      <Card className="flex h-full flex-col gap-4 p-2 pb-4 transition-shadow duration-300 hover:shadow-xl">
        <div className="bg-[#F4F6FB] relative rounded-[10px] overflow-hidden aspect-[314/216] lg:aspect-square xl:aspect-[314/216] w-full">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, (max-width: 1280px) 33vw, 314px"
          />
        </div>

        <CardHeader className="gap-2 px-2 pb-0">
          <CardDescription className="text-[14px] font-medium tracking-[-0.01em]">{label}</CardDescription>
          <CardTitle className="line-clamp-2 text-[18px] leading-[1.24] tracking-[-0.02em]">{title}</CardTitle>
        </CardHeader>

        <CardFooter className="mt-auto px-2 pt-2">
          <Button variant="outline" rounded="full" className="w-full text-text-body">
            {buttonText}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
