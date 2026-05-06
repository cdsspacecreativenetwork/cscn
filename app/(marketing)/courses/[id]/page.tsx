'use client';

import { ClassLessons } from '@/components/courses/ClassLessons';
import { CourseHero } from '@/components/courses/CourseHero';
import { CourseDetails } from '@/components/courses/CourseDetails';

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  // Mock data for initial high-fidelity implementation
  const courseData = {
    title: "How to position your brand to attract global audience.",
    description: "You and I will learn how to position your brand to attract a global audience.",
    instructor: {
      name: "Chris John",
      role: "Full-Stack Designer",
      image: "/assets/courses/Frame 2147228498.svg"
    },
    publishDate: "May 1, 2026",
    videoThumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
    enrolledCount: "193,763",
    price: "$150",
    aboutText: `Hi there, welcome to How to Position Your Brand to Attract a Global Audience. Together, you and I are going to learn how to shape, refine, and present your brand so it connects with people anywhere in the world. This is not just about making things look good, it is about building a brand that feels clear, relevant, and valuable across different cultures and markets.

In this course, we will focus on practical strategies you can actually use. We will break down what makes global brands stand out and how you can apply those same ideas to your own work. Most importantly, you will understand how people see your brand and what it takes to earn their attention and trust on a global level.

This course is for creatives, founders, and professionals at any level. If you are just starting out or not fully sure what brand positioning really means, that is completely fine. We will start from the basics and build everything step by step until it feels simple and clear.

First, we will define what your brand stands for and how to communicate it clearly. Then you will learn how to understand your audience beyond your local space. From there, we will shape a strong brand message that connects globally while still feeling real and authentic.

You will learn how to build a consistent visual and verbal identity, from colors and typography to tone of voice. We will also cover how to position your brand against competitors and stand out in crowded markets. Along the way, you will get simple frameworks you can reuse for any project or business.

We will also look at real examples and break down what works and what does not, so you can avoid common mistakes and move faster. By the end of this course, you will have a clear direction, a stronger brand presence, and the confidence to present your work to a global audience.

It is time to level up your thinking and position your brand for the world.`
  };

  const lessons = [
    { id: 1, title: "Introduction to personal branding", duration: "1:30", isLocked: false, isActive: true },
    { id: 2, title: "Defining your unique value proposition", duration: "5:20", isLocked: true },
    { id: 3, title: "Target audience identification", duration: "8:45", isLocked: true },
    { id: 4, title: "Visual identity and brand voice", duration: "12:10", isLocked: true },
    { id: 5, title: "Building a global presence", duration: "15:30", isLocked: true },
    { id: 6, title: "Marketing across cultures", duration: "10:15", isLocked: true },
    { id: 7, title: "Social media for global brands", duration: "7:40", isLocked: true },
    { id: 8, title: "Networking on a global scale", duration: "9:20", isLocked: true },
    { id: 9, title: "Scaling your brand identity", duration: "14:50", isLocked: true },
    { id: 10, title: "Final project: Brand positioning deck", duration: "25:00", isLocked: true },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex flex-col gap-[clamp(24px,3.7vw,48px)] pb-20 pt-20">
      <CourseHero 
        courseTitle={courseData.title}
        courseDescription={courseData.description}
        instructorName={courseData.instructor.name}
        instructorImage={courseData.instructor.image}
        publishDate={courseData.publishDate}
        videoThumbnail={courseData.videoThumbnail}
      />

      {/* Main Content Sections */}
      <div className="px-[clamp(20px,11.57vw,200px)] w-full flex justify-center">
        <div className="grid grid-cols-1 mlg:grid-cols-12 gap-[clamp(24px,1.85vw,32px)] items-start w-full max-w-[1440px]">
          {/* Left: Lessons Sidebar */}
          <div className="mlg:col-span-4 w-full">
            <ClassLessons 
              totalLessons={94}
              totalDuration="10h 10m"
              lessons={lessons}
            />
          </div>

          {/* Right: Course Details */}
          <div className="mlg:col-span-8 w-full">
            <CourseDetails 
              enrolledCount={courseData.enrolledCount}
              price={courseData.price}
              description={courseData.aboutText}
              instructor={courseData.instructor}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
