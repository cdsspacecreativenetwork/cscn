'use client';

import React from 'react';

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="topbar" style={{
      height: '96px',
      background: 'white',
      borderBottom: '1px solid var(--stroke)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 clamp(16px, 4vw, 32px)',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onMenuClick}
          className="mobile-only-flex"
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '24px', 
            cursor: 'pointer',
            display: 'none'
          }}
        >
          ☰
        </button>
        <div className="search-container" style={{
          background: 'var(--background)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 20px',
          width: 'clamp(200px, 30vw, 461px)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Search..." 
            style={{ 
              border: 'none', 
              background: 'transparent', 
              outline: 'none', 
              width: '100%',
              fontSize: '14px'
            }} 
          />
        </div>
      </div>

      <div className="user-actions" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 24px)' }}>
        <button className="desktop-only" style={{ 
          background: 'none', 
          border: 'none', 
          fontSize: '20px', 
          cursor: 'pointer',
          borderRight: '1px solid var(--stroke)',
          paddingRight: '24px',
          display: 'block'
        }}>
          🔔
        </button>
        <div className="profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="avatar" style={{
            width: 'clamp(36px, 5vw, 48px)',
            height: 'clamp(36px, 5vw, 48px)',
            borderRadius: 'var(--radius-full)',
            background: '#E3E8F4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'var(--navy)',
            fontSize: 'clamp(12px, 2vw, 14px)'
          }}>
            JD
          </div>
          <div className="user-info desktop-only">
            <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '14px' }}>John Doe</div>
            <div style={{ color: 'var(--text-mute)', fontSize: '12px' }}>Premium Student</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-only-flex {
            display: flex !important;
          }
          .desktop-only {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}
