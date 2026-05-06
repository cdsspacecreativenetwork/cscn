import React from 'react';
import Button from '@/components/ui/Button';

export default function Page() {
  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Settings</h1>
      <p style={{ color: 'var(--text-mute)' }}>Manage your account settings and preferences.</p>
      <div className="card" style={{ marginTop: '40px', maxWidth: '600px' }}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Full Name</label>
          <input type="text" defaultValue="John Doe" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--stroke)' }} />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Email Address</label>
          <input type="email" defaultValue="john@example.com" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--stroke)' }} />
        </div>
        <Button variant="primary" size="md">Save Changes</Button>
      </div>
    </div>
  );
}
