'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import type { Course } from '@/lib/api';

export default function CourseDetailClient({ course }: { course: Course }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Main Column */}
        <div className="lg:col-span-2">
          
          {/* Tabs */}
          <div className="flex border-b border-stroke mb-10 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {['overview', 'syllabus', 'instructor', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                  activeTab === tab ? 'text-primary' : 'text-text-mute hover:text-navy'
                }`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="min-h-[30rem]">
            {activeTab === 'overview' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-navy mb-6">What you'll learn</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 p-8 rounded-2xl border border-stroke mb-10">
                  {[
                    'Design professional UI/UX projects from scratch',
                    'Master Figma advanced features like Auto Layout and Variants',
                    'Create interactive, high-fidelity prototypes',
                    'Understand design systems and documentation',
                    'Collaborate effectively with developers and stakeholders',
                    'Build a world-class design portfolio'
                  ].map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-primary font-bold">✓</span>
                      <span className="text-text-body text-[0.9375rem]">{item}</span>
                    </div>
                  ))}
                </div>
                
                <h2 className="text-2xl font-bold text-navy mb-6">Description</h2>
                <div className="prose prose-slate max-w-none text-text-body leading-relaxed space-y-4">
                  <p>{course.description}</p>
                  <p>
                    Throughout the course, you will work on real-world projects, including a mobile app for financial services 
                     and a complex dashboard for creative collaboration. You'll learn not just how to use Figma, 
                     but how to solve problems through design.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'syllabus' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-navy mb-6">Course Content</h2>
                <div className="flex flex-col gap-4">
                  {course.syllabus.length > 0 ? course.syllabus.map((module, i) => (
                    <div key={i} className="bg-white border border-stroke rounded-xl overflow-hidden shadow-sm">
                      <div className="p-5 flex justify-between items-center cursor-pointer hover:bg-background transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                            {i + 1}
                          </span>
                          <h4 className="font-bold text-navy">{module.title}</h4>
                        </div>
                        <span className="text-sm text-text-mute">{module.lessons} lessons</span>
                      </div>
                    </div>
                  )) : (
                    <div className="py-20 text-center border-2 border-dashed border-stroke rounded-3xl">
                      <div className="text-4xl mb-4">📚</div>
                      <p className="text-text-mute font-medium">Full syllabus coming soon!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'instructor' && (
              <div className="animate-in fade-in duration-500">
                <h2 className="text-2xl font-bold text-navy mb-8">Meet your Instructor</h2>
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden relative border-4 border-background shadow-lg flex-shrink-0">
                    <Image src={course.authorAvatar} alt={course.author} fill className="object-cover" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-navy mb-1">{course.author}</h3>
                    <p className="text-primary font-semibold mb-4">{course.authorRole}</p>
                    <div className="flex gap-6 mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-navy">{course.rating}</div>
                        <div className="text-xs text-text-mute uppercase tracking-widest font-bold">Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-navy">120K+</div>
                        <div className="text-xs text-text-mute uppercase tracking-widest font-bold">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-navy">12</div>
                        <div className="text-xs text-text-mute uppercase tracking-widest font-bold">Courses</div>
                      </div>
                    </div>
                    <p className="text-text-body leading-relaxed max-w-[35rem]">
                      {course.author} is a seasoned professional with over 10 years of experience in the creative industry. 
                      They have worked with top global brands and startups, helping them build scalable digital products and meaningful brand identities.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="animate-in fade-in duration-500 py-20 text-center bg-background/30 rounded-3xl border border-stroke">
                <div className="text-5xl mb-6">📂</div>
                <h3 className="text-xl font-bold text-navy mb-2">No Reviews Yet</h3>
                <p className="text-text-body">Be the first to share your thoughts after enrolling!</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / CTA Card */}
        <div className="lg:relative">
          <div className="lg:sticky lg:top-28 bg-white border border-stroke rounded-3xl shadow-2xl overflow-hidden z-20">
            {/* Preview Video Placeholder */}
            <div className="aspect-video bg-navy relative group cursor-pointer">
              <Image src={course.image} alt="Preview" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-primary text-2xl shadow-xl group-hover:scale-110 transition-transform">
                  ▶
                </div>
              </div>
              <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-bold tracking-wider">
                PREVIEW THIS COURSE
              </div>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col gap-1 mb-8">
                <span className="text-2xl font-bold text-navy">Included with Pro</span>
                <span className="text-sm text-text-mute">Get unlimited access to this and 100+ other courses.</span>
              </div>
              
              <div className="flex flex-col gap-3 mb-8">
                <Button className="w-full py-6 text-lg">Start Learning</Button>
                <Button variant="outline" className="w-full py-6 text-lg">View Subscription Plans</Button>
              </div>
              
              <p className="text-center text-xs text-text-mute mb-8 font-medium">Cancel anytime. 7-day free trial.</p>
              
              <div className="space-y-4">
                <h5 className="font-bold text-navy text-sm uppercase tracking-widest mb-2">This course includes:</h5>
                {[
                  { icon: '🎬', text: `${course.duration} on-demand video` },
                  { icon: '📄', text: '12 downloadable resources' },
                  { icon: '📱', text: 'Access on mobile and TV' },
                  { icon: '🏆', text: 'Certificate of completion' }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-text-body text-sm">
                    <span className="text-lg">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
