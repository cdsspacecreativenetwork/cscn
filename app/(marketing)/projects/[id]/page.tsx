import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROJECTS_DETAILS } from '@/lib/projects';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const project = PROJECTS_DETAILS[resolvedParams.id];

  if (!project) notFound();

  return (
    <div className="min-h-screen bg-background pt-32 pb-24">
      <div className="container max-w-4xl">
        <Link 
          href="/#community" 
          className="inline-flex items-center gap-2 text-text-mute hover:text-primary transition-colors mb-8 font-semibold"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Community
        </Link>

        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-stroke-ii">
          {/* Hero Image */}
          <div className="relative w-full h-[500px]">
            <Image 
              src={project.image} 
              alt={project.title} 
              fill 
              className="object-cover" 
              sizes="(max-width: 896px) 100vw, 896px"
              unoptimized={project.image.endsWith('.svg')}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-12 left-12 right-12">
              <span className="bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 inline-block">
                CSCN Showcase
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                {project.title}
              </h1>
            </div>
          </div>

          <div className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="md:col-span-2">
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-navy mb-6">Project Brief</h2>
                  <p className="text-xl text-text-body leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-navy mb-6">Key Outcomes</h2>
                  <div className="space-y-4">
                    {project.outcomes.map((outcome, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 bg-background rounded-2xl border border-stroke">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                        </div>
                        <p className="text-lg text-navy font-semibold">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="p-6 bg-background rounded-3xl border border-stroke shadow-sm">
                  <p className="text-sm font-bold text-text-mute uppercase tracking-widest mb-4">Student</p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-stroke flex items-center justify-center text-xl font-bold text-primary">
                      {project.student.charAt(0)}
                    </div>
                    <p className="text-lg font-bold text-navy">{project.student}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-text-mute uppercase tracking-widest mb-3">Course</p>
                  <p className="text-lg font-bold text-navy leading-snug">{project.course}</p>
                </div>

                <div>
                  <p className="text-sm font-bold text-text-mute uppercase tracking-widest mb-3">Tools</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tools.map((tool, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white border border-stroke rounded-xl text-xs font-bold text-navy uppercase tracking-wider">
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-stroke">
                  <Link href="/courses" className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-center hover:bg-navy transition-all block shadow-lg shadow-primary/20">
                    Join this Course
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
