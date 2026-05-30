import React from 'react';
import { CertificateHero } from '@/components/certificate/CertificateHero';
import { OutstandingCommunity } from '@/components/certificate/OutstandingCommunity';
import { CertificateFAQ } from '@/components/certificate/CertificateFAQ';
import { getCertificateCommunityMembers } from '@/data/certificate-community';

export default async function CertificatePage() {
  const communityMembers = await getCertificateCommunityMembers();

  return (
    <main className="min-h-screen bg-[#F4F6FB] flex flex-col">
      
      <div className="flex-1 flex flex-col">
        {/* 1. Hero Block (White Top, Navy Bottom with Envelope and Text Requirements) */}
        <CertificateHero />
        
        {/* 2. Outstanding Community Block (Diamond Avatar Constellation on Light Gray) */}
        <OutstandingCommunity members={communityMembers} />
        
        {/* 3. Certificate FAQs Block (Accordion List on Light Gray) */}
        <CertificateFAQ />
      </div>

    </main>
  );
}
