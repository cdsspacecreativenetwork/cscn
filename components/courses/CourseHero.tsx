'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

interface CourseHeroProps {
  courseTitle: string;
  courseDescription: string;
  instructorName: string;
  instructorImage: string;
  publishDate: string;
  videoThumbnail: string;
  videoUrl?: string;
}

export const CourseHero: React.FC<CourseHeroProps> = ({
  courseTitle,
  courseDescription,
  instructorName,
  instructorImage,
  publishDate,
  videoThumbnail,
  videoUrl = "https://res.cloudinary.com/emediong/video/upload/v1778071570/CDS_Space_Branding_Agency_hhhxkq.mp4"
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
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

  return (
    <div className="bg-[#040B37] w-full px-[clamp(16px,5vw,200px)] py-[clamp(16px,2vw,24px)] relative overflow-hidden">
      {/* Video Frame */}
      <div className="relative w-full aspect-video md:h-[clamp(400px,46.3vw,800px)] border-[clamp(2px,0.46vw,8px)] border-[#0E1648] rounded-[clamp(12px,1.39vw,24px)] overflow-hidden bg-black group shadow-2xl">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={videoThumbnail}
          className="w-full h-full object-cover cursor-pointer"
          onEnded={() => setIsPlaying(false)}
          onClick={() => togglePlay()}
        />

        {/* Content Overlay Card - Only visible on Tablet/Desktop when not playing */}
        {!isPlaying && (
          <div className="hidden md:block absolute left-[clamp(20px,2.78vw,48px)] bottom-[clamp(40px,5.56vw,96px)] w-full max-w-[280px] mlg:max-w-[clamp(300px,28.07vw,485px)] backdrop-blur-md bg-[rgba(0,0,0,0.64)] p-4 mlg:p-[clamp(16px,1.39vw,24px)] rounded-[16px] border border-white/10 z-10 transition-opacity duration-500">
            <h1 className="text-[16px] mlg:text-[clamp(20px,1.85vw,32px)] font-bold text-white tracking-tight leading-[1.24] mb-3 mlg:mb-6">
              {courseTitle}
            </h1>
            <p className="text-[13px] mlg:text-[clamp(14px,0.92vw,16px)] font-medium text-[#9CA3AF] leading-relaxed mb-4 mlg:mb-6 line-clamp-2 mlg:line-clamp-none">
              {courseDescription}
            </p>

            <div className="flex items-center gap-2">
              <div className="relative w-6 h-6 mlg:w-8 mlg:h-8 rounded-full overflow-hidden border border-white/20">
                <Image src={instructorImage} alt={instructorName} fill className="object-cover" />
              </div>
              <div className="flex items-center gap-2 text-white text-[12px] mlg:text-[14px]">
                <span className="font-semibold">{instructorName}</span>
                <span className="w-1 h-1 bg-white/40 rounded-full"></span>
                <span className="text-[#9CA3AF] text-[11px] mlg:text-[13px]">{publishDate}</span>
              </div>
            </div>
          </div>
        )}

        {/* Center Play Button for Mobile */}
        {!isPlaying && (
          <div className="md:hidden absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
            <button
              onClick={() => togglePlay()}
              className="w-16 h-16 bg-[#1C4ED1] rounded-full flex items-center justify-center shadow-2xl animate-pulse pointer-events-auto active:scale-90 transition-transform"
            >
              <div className="w-8 h-8 relative ml-1">
                <Image src="/assets/video-controls/play.svg" alt="Play" fill className="brightness-200" />
              </div>
            </button>
          </div>
        )}

        {/* Video Control Pill - Scaled for screens */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute bottom-4 md:bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-[6px] md:gap-[5px] lg:gap-[10px] bg-[rgba(0,0,0,0.48)] backdrop-blur-xl p-[3px] md:p-[2px] rounded-[100px] shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20 transition-all duration-300 ${!isPlaying ? 'hidden md:flex' : 'flex'
            }`}
        >
          {/* Watch Demo / Play Button */}
          <button
            onClick={togglePlay}
            className="flex items-center gap-[4px] md:gap-[6px] lg:gap-[8px] bg-[#1C4ED1] hover:bg-[#1C4ED1]/90 text-[#F4F6FB] px-2.5 md:px-2 lg:px-6 py-1.5 md:py-2 lg:py-[16px] rounded-[100px] transition-all group/btn active:scale-95 cursor-pointer outline-none"
          >
            <div className="w-[14px] h-[14px] md:w-[18px] lg:w-[24px] h-[14px] md:h-[18px] lg:h-[24px] relative shrink-0">
              <Image
                src={isPlaying ? "/assets/video-controls/pause.svg" : "/assets/video-controls/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                fill
                className="object-contain filter brightness-200"
              />
            </div>
            <span className="text-[11px] md:text-[13px] lg:text-[16px] font-medium tracking-[-0.16px] whitespace-nowrap">
              {isPlaying ? (
                <span className="hidden sm:inline">Pause Video</span>
              ) : (
                <span className="hidden sm:inline">Watch Demo</span>
              )}
              {/* Short text or hide on mobile */}
              {!isPlaying && <span className="sm:hidden hidden">Watch</span>}
              {isPlaying && <span className="sm:hidden hidden">Pause</span>}
            </span>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-[2px] md:gap-[5px] lg:gap-[10px]">
            {[
              { icon: 'volume.svg', action: toggleMute, active: isMuted },
              { icon: 'fullscreen.svg', action: toggleFullscreen },
              { icon: 'settings.svg', action: () => { } }
            ].map((ctrl, i) => (
              <button
                key={i}
                onClick={ctrl.action}
                className={`w-[28px] h-[28px] md:w-[36px] lg:w-[56px] h-[28px] md:h-[36px] lg:h-[56px] flex items-center justify-center bg-[rgba(0,0,0,0.2)] hover:bg-white/10 rounded-[100px] transition-all relative group/ctrl cursor-pointer ${ctrl.active ? 'opacity-40' : 'opacity-100'}`}
              >
                <Image src={`/assets/video-controls/${ctrl.icon}`} alt="" fill className="object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Info Section (Udemy style stacking) */}
      <div className="md:hidden mt-6 flex flex-col gap-4">
        <h1 className="text-[24px] font-bold text-white leading-[1.2]">
          {courseTitle}
        </h1>
        <p className="text-[14px] text-[#9CA3AF] leading-relaxed">
          {courseDescription}
        </p>
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/20">
            <Image src={instructorImage} alt={instructorName} fill className="object-cover" />
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[14px] font-semibold">{instructorName}</span>
            <span className="text-[#9CA3AF] text-[12px]">{publishDate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};