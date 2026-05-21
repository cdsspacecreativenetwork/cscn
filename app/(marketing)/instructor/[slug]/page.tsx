import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourses } from '@/lib/api';
import CourseCard from '@/components/ui/CourseCard';

// Shared instructor data (in a real app, this would come from a database/API)
const INSTRUCTORS = [
  {
    slug: 'chris-john',
    name: 'Chris John',
    role: 'Brand Strategist & Full-Stack Designer',
    image: '/assets/instructors/Frame 2147238910-5.svg',
    bio: 'Chris is a multifaceted designer and strategist with over a decade of experience helping global brands find their voice and visual identity. He specializes in bridging the gap between design and business strategy.',
    stats: { students: '15,200+', courses: 4, reviews: '4,800+' },
  },
  {
    slug: 'ayomide-ajayi',
    name: 'Ayomide Ajayi',
    role: 'Creative Director & Digital Designer',
    image: '/assets/instructors/Frame 2147238910-3.svg',
    bio: 'Ayomide is a visionary creative director who has led campaigns for Fortune 500 companies. His expertise lies in crafting compelling digital experiences that resonate with users on a profound level.',
    stats: { students: '22,450+', courses: 6, reviews: '8,150+' },
  },
  {
    slug: 'honest-ernest',
    name: 'Honest Ernest',
    role: 'Senior Product Designer',
    image: '/assets/instructors/img-1.svg',
    bio: 'Honest is a product design maestro focusing on user-centric solutions. With a keen eye for detail and a passion for accessibility, he creates interfaces that are both beautiful and highly functional.',
    stats: { students: '34,000+', courses: 8, reviews: '12,450+' },
  },
  {
    slug: 'baribor-duba',
    name: 'Baribor Duba',
    role: 'AI Engineer & Product Lead',
    image: '/assets/instructors/img.svg',
    bio: 'Baribor (Barry) is at the forefront of AI integration in product development. He empowers teams to leverage cutting-edge AI tools to build smarter, faster, and more innovative digital products.',
    stats: { students: '18,600+', courses: 5, reviews: '5,600+' },
  }
];

export default async function InstructorPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const instructor = INSTRUCTORS.find(inst => inst.slug === resolvedParams.slug);

  if (!instructor) {
    notFound();
  }

  const allCourses = await getCourses();

  // Match course author with instructor name (handle slight variations like Barry Dubor vs Baribor Duba)
  const instructorCourses = allCourses.filter(course => {
    if (instructor.slug === 'baribor-duba') {
      return course.author.toLowerCase().includes('barry');
    }
    return course.author.toLowerCase().includes(instructor.name.split(' ')[0].toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Instructor Header Section */}
      <div className="bg-navy text-white pt-32 pb-20 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[140%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-50%] left-[-10%] w-[50%] h-[100%] bg-[#648EFC]/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="container relative z-10">
          <Link href="/#instructors" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 font-inter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
            Back to Home
          </Link>
          <div className="flex flex-col md:flex-row gap-10 items-center md:items-start max-w-5xl mx-auto">
            {/* Instructor Avatar */}
            <div className="w-[200px] h-[200px] md:w-[280px] md:h-[280px] flex-shrink-0 relative rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl">
              <Image
                src={instructor.image}
                alt={instructor.name}
                fill
                className="object-cover object-top lg:object-center"
                sizes="(max-width: 768px) 200px, 280px"
                preload
                unoptimized={instructor.image.endsWith('.svg')}
              />
            </div>

            {/* Instructor Details */}
            <div className="flex-1 text-center md:text-left flex flex-col justify-center h-full pt-4">
              <span className="text-primary font-semibold tracking-wider uppercase text-sm mb-2 block">
                CSCN Instructor
              </span>
              <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
                {instructor.name}
              </h1>
              <p className="text-xl md:text-2xl text-white/80 font-medium mb-6">
                {instructor.role}
              </p>
              <p className="text-white/70 text-base md:text-lg leading-relaxed max-w-2xl mb-8">
                {instructor.bio}
              </p>

              {/* Stats Row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-8">
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{instructor.stats.students}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wide">Students</div>
                </div>
                <div className="w-px h-10 bg-white/20 hidden sm:block"></div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{instructor.stats.courses}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wide">Courses</div>
                </div>
                <div className="w-px h-10 bg-white/20 hidden sm:block"></div>
                <div>
                  <div className="text-3xl font-bold text-white mb-1">{instructor.stats.reviews}</div>
                  <div className="text-sm text-white/60 uppercase tracking-wide">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div className="container mt-20">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-navy tracking-tight">
              Courses by {instructor.name}
            </h2>
            <span className="bg-navy/5 text-navy px-4 py-2 rounded-full text-sm font-semibold">
              {instructorCourses.length} {instructorCourses.length === 1 ? 'Course' : 'Courses'} Available
            </span>
          </div>

          {instructorCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructorCourses.map(course => (
                <div key={course.id}>
                  <CourseCard {...course} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-stroke-ii shadow-sm">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-navy mb-2">No courses found</h3>
              <p className="text-text-mute text-lg">
                Looks like {instructor.name} is currently preparing new content. Check back later!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
