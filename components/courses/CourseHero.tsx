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
  videoUrl = "/assets/CDS Space Branding Agency.mp4"
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
    <div className="bg-[#040B37] w-full px-[clamp(20px,11.57vw,200px)] py-[clamp(24px,1.39vw,24px)] relative overflow-hidden">
      {/* Video Frame */}
      <div className="relative w-full h-[clamp(400px,46.3vw,800px)] border-[clamp(4px,0.46vw,8px)] border-[#0E1648] rounded-[clamp(12px,1.39vw,24px)] overflow-hidden bg-black group shadow-2xl">
        <video
          ref={videoRef}
          src={videoUrl}
          poster={videoThumbnail}
          className="w-full h-full object-cover cursor-pointer"
          onEnded={() => setIsPlaying(false)}
          onClick={() => togglePlay()}
        />

        {/* Content Overlay Card - Only visible when not playing */}
        {!isPlaying && (
          <div className="absolute left-[clamp(20px,2.78vw,48px)] bottom-[clamp(40px,5.56vw,96px)] w-full max-w-[280px] mlg:max-w-[clamp(300px,28.07vw,485px)] backdrop-blur-md bg-[rgba(0,0,0,0.64)] p-4 mlg:p-[clamp(16px,1.39vw,24px)] rounded-[16px] border border-white/10 z-10 transition-opacity duration-500">
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

        {/* Video Control Pill */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 mlg:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-[8px] mlg:gap-[10px] bg-[rgba(0,0,0,0.48)] backdrop-blur-xl p-[4px] rounded-[100px] shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20"
        >
          {/* Watch Demo / Play Button */}
          <button
            onClick={togglePlay}
            className="flex items-center gap-[8px] bg-[#1C4ED1] hover:bg-[#1C4ED1]/90 text-[#F4F6FB] px-5 py-3.5 mlg:p-[16px] rounded-[100px] transition-all group/btn active:scale-95 cursor-pointer"
          >
            <div className="w-[22px] h-[22px] mlg:w-[24px] mlg:h-[24px] relative shrink-0">
              <Image
                src={isPlaying ? "/assets/video-controls/pause.svg" : "/assets/video-controls/play.svg"}
                alt={isPlaying ? "Pause" : "Play"}
                fill
                className="object-contain filter brightness-200"
              />
            </div>
            <span className="text-[15px] mlg:text-[16px] font-medium tracking-[-0.16px] whitespace-nowrap">
              {isPlaying ? "Pause Video" : "Watch Demo"}
            </span>
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-[8px] mlg:gap-[10px]">
            {[
              { icon: 'volume.svg', action: toggleMute, active: isMuted },
              { icon: 'fullscreen.svg', action: toggleFullscreen },
              { icon: 'settings.svg', action: () => {} }
            ].map((ctrl, i) => (
              <button
                key={i}
                onClick={ctrl.action}
                className={`w-[48px] h-[48px] mlg:w-[56px] mlg:h-[56px] flex items-center justify-center bg-[rgba(0,0,0,0.2)] hover:bg-white/10 rounded-[100px] transition-all relative group/ctrl cursor-pointer ${ctrl.active ? 'opacity-40' : 'opacity-100'}`}
              >
                <div className="w-5 h-5 mlg:w-6 mlg:h-6 relative">
                  <Image src={`/assets/video-controls/${ctrl.icon}`} alt="" fill className="object-contain" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
