import React from 'react';

export default function Page() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Schedule</h1>
      <p style={{ color: 'var(--text-mute)' }}>View and manage your upcoming classes and mentorship sessions.</p>
      <div className="card" style={{ marginTop: '40px', textAlign: 'center', padding: '100px' }}>
        <p>No upcoming events found.</p>
      </div>
    </div>
  );
}
