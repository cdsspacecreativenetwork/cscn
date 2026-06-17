'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function Hero() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

  const revealControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 1800);
    }
  };

  // Sync duration once metadata is loaded or if already loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.readyState >= 1) {
      setDuration(video.duration);
    }

    const handleLoadedMetadata = () => setDuration(video.duration);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
      setShowControls(true);
      if (!isPlaying) {
        if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 1800);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative pt-[10.5rem] pb-[8.25rem] bg-[#EFF3FF] overflow-hidden flex flex-col items-center text-center">
      {/* Curve Background */}
      <div className="absolute top-[-2.375rem] left-1/2 -translate-x-1/2 w-[111rem] h-[47.625rem] z-0 pointer-events-none">
        <Image
          src="/assets/hero-curve.svg"
          alt="Curve Background"
          fill
          preload
          className="object-contain"
          sizes="100vw"
          unoptimized
        />
      </div>

      <div className="container relative z-10 flex w-full flex-col items-center min-[1728px]:max-w-[100rem] min-[1728px]:px-12">
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-full inline-flex items-center gap-2 md:gap-2.5 mb-10 shadow-md border border-stroke max-w-[95%] md:max-w-none"
        >
          <div className="flex items-center ml-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`w-6 h-6 md:w-8 md:h-8 rounded-full border border-[#F4F6FB] overflow-hidden relative bg-[#eee] ${i === 1 ? '' : '-ml-2 md:-ml-3'}`}
              >
                <Image src={`/assets/avatars/avatar${i}.png`} alt={`Instructor ${i}`} fill sizes="32px" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1 md:gap-1.5">
            <span className="text-[10px] md:text-sm font-medium text-text-body whitespace-nowrap">Expert in these tools</span>
            <div className="flex items-center gap-1 bg-[#F4F6FB] px-1.5 py-0.5 rounded-full">
              <div className="w-3 h-3 md:w-4 md:h-4 relative">
                <Image src="/assets/expert-badge.svg" alt="Expert" fill sizes="16px" unoptimized />
              </div>
              <span className="text-[10px] md:text-sm font-bold text-primary tracking-tight">more</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-[2.5rem] md:text-[3.5rem] font-semibold leading-[1.2] md:leading-[1.24] text-navy mb-6 md:mb-10 tracking-tight max-w-[49rem]"
        >
          Build Real Skills.<br className="hidden md:block" /> Work Globally.
        </motion.h1>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="text-xl font-medium text-text-body max-w-[36.25rem] mb-10 leading-relaxed tracking-tight"
        >
          Learn design, product, and digital skills taught by professionals building real companies around the world.
        </motion.p>

        {/* Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          className="mb-[5.5rem]"
        >
          <Link href="/courses">
            <Button variant="gradient" size="lg" rounded="full">
              Start Learning
            </Button>
          </Link>
        </motion.div>

        {/* Video Frame */}
        <motion.div 
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-[68.875rem] aspect-[1102/640] bg-navy rounded-3xl border-[8px] border-white shadow-2xl overflow-hidden min-[1728px]:max-w-[69rem]"
          onMouseMove={revealControls}
          onTouchStart={revealControls}
        >
          <video
            ref={videoRef}
            src="https://res.cloudinary.com/emediong/video/upload/v1778071570/CDS_Space_Branding_Agency_hhhxkq.mp4"
            className="w-full h-full object-cover cursor-pointer"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onClick={() => togglePlay()}
          />

          {/* Custom Controls Overlay */}
          <div
            onClick={(e) => e.stopPropagation()}
            className={`absolute bottom-3 left-1/2 z-10 flex w-[90%] max-w-[55rem] -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/50 p-1 backdrop-blur-xl transition-all duration-300 sm:bottom-6 sm:gap-2.5 lg:bottom-10 ${
              !isPlaying || showControls ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'
            }`}
          >
            {/* Watch Demo / Play Button */}
            <div
              onClick={togglePlay}
              className={`flex cursor-pointer items-center gap-2 rounded-full p-1 transition-all duration-300 sm:gap-3 ${isPlaying ? 'bg-transparent' : 'bg-primary'}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full sm:h-14 sm:w-14 ${isPlaying ? 'bg-white/10' : 'bg-white'}`}>
                {isPlaying ? (
                  <div className="w-full h-full relative">
                    <Image src="/assets/video-controls/pause.svg" alt="Pause" fill className="object-contain" sizes="56px" unoptimized />
                  </div>
                ) : (
                  <span className="ml-0.5 text-lg text-primary sm:ml-1 sm:text-2xl">▶</span>
                )}
              </div>
              {!isPlaying && <span className="hidden pr-4 text-sm font-semibold text-white whitespace-nowrap sm:inline sm:pr-6 sm:text-base">Watch Demo</span>}
            </div>

            {/* Progress Slider */}
            <div className="flex-1 flex items-center px-2">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                step="0.1"
                onChange={handleSeek}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 outline-none sm:h-2.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md sm:[&::-webkit-slider-thumb]:h-5 sm:[&::-webkit-slider-thumb]:w-5"
              />
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 pr-1 sm:gap-2 sm:pr-3">
              <button onClick={toggleMute} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 transition-colors hover:bg-white/20 sm:h-12 sm:w-12">
                <div className={`w-full h-full relative ${isMuted ? 'opacity-50' : 'opacity-100'}`}>
                  <Image src="/assets/video-controls/volume.svg" alt="Volume" fill className="object-contain" sizes="48px" unoptimized />
                </div>
              </button>
              <button onClick={toggleFullscreen} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 transition-colors hover:bg-white/20 sm:h-12 sm:w-12">
                <div className="w-full h-full relative">
                  <Image src="/assets/video-controls/fullscreen.svg" alt="Fullscreen" fill className="object-contain" sizes="48px" unoptimized />
                </div>
              </button>
              {/* <button className="bg-white/10 border-none w-12 h-12 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors">
                <div className="w-full h-full relative">
                  <Image src="/assets/video-controls/settings.svg" alt="Settings" fill className="object-contain" />
                </div>
              </button> */}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
