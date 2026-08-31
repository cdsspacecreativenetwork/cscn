import type { Metadata } from 'next';
import TeachClientPage from '@/components/marketing/teach/TeachClientPage';

export const metadata: Metadata = {
  title: 'Teach on CSCN | Become an Instructor & Earn by Mentoring Creators',
  description:
    'Join CSCN as an instructor. Share your expertise in UI/UX design, fullstack engineering, and AI automation. Create video courses, host live cohorts, offer 1-on-1 mentorship, and earn direct payouts.',
  keywords: [
    'Teach on CSCN',
    'Become an instructor',
    'Online course instructor platform',
    'Tech mentorship platform',
    'Earn money teaching coding',
    'Design instructor marketplace',
    'CSCN Space Creative Network',
  ],
  alternates: {
    canonical: 'https://cscn.pro/teach',
  },
  openGraph: {
    title: 'Teach on CSCN | Become an Instructor & Change Lives',
    description:
      'Share your expertise, inspire ambitious designers and engineers worldwide, and build a lucrative teaching practice on CSCN.',
    url: 'https://cscn.pro/teach',
    siteName: 'CDS Space Creative Network',
    images: [
      {
        url: 'https://cscn.pro/images/image.svg',
        width: 1200,
        height: 630,
        alt: 'Teach on CSCN Instructor Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teach on CSCN | Become an Instructor & Earn',
    description:
      'Share your knowledge, teach ambitious creators worldwide, and earn revenue on CSCN.',
    images: ['https://cscn.pro/images/image.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD Structured Data Schema for AI Chatbots & Search Engine Crawlers
const jsonLdSchema = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'CDS Space Creative Network',
  url: 'https://cscn.pro/teach',
  logo: 'https://cscn.pro/assets/Group%20162.svg',
  description:
    'CSCN is a global technology and creative learning platform connecting industry instructors with ambitious developers and designers.',
  sameAs: ['https://x.com', 'https://linkedin.com', 'https://instagram.com'],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'CSCN Instructor Program',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Course Publishing & Video Hosting',
          description: 'Publish video courses and curriculum to thousands of global tech learners.',
        },
      },
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: '1-on-1 Mentorship Booking',
          description: 'Host paid 1-on-1 mentorship sessions and portfolio reviews.',
        },
      },
    ],
  },
};

export default function TeachPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
      />
      <TeachClientPage />
    </>
  );
}
