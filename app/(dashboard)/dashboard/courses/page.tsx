'use client';

import React, { useState } from 'react';
import CourseCard from '@/components/ui/CourseCard';

const tabs = ['All', 'In Progress', 'Completed', 'Saved'];

export default function MyCourses() {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="my-courses">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>My Courses</h1>
        <p style={{ color: 'var(--text-mute)' }}>Track and manage your learning journey</p>
      </header>

      <div className="tabs" style={{ 
        display: 'flex', 
        gap: '8px', 
        background: 'white', 
        padding: '6px', 
        borderRadius: 'var(--radius-md)',
        width: 'fit-content',
        marginBottom: '40px',
        border: '1px solid var(--stroke)'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--text-body)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: '0.2s'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
        {[
          { title: 'Figma UIUX Design for beginners', category: 'Design', lessons: '55', author: 'Chris John', progress: 75 },
          { title: 'Advanced Motion Design in AE', category: 'Motion', lessons: '15', author: 'Barry Dubor', progress: 30 },
          { title: 'UI Engineering with React & Next.js', category: 'Development', lessons: '25', author: 'Honest Ernest', progress: 50 },
          { title: 'Brand Identity Essentials with AI', category: 'Design', lessons: '20', author: 'Ayomide Ajayi', progress: 10 },
        ].map((course, i) => (
          <CourseCard key={i} {...course} />
        ))}
      </div>
    </div>
  );
}
