import React from 'react';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';

export default function MarketingLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <div className="marketing-layout">
      <Navbar />
      <main>{children}</main>
      {modal}
      <Footer />
    </div>
  );
}
