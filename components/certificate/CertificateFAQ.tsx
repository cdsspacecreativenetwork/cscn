import FAQSection, { type FAQEntry } from '@/components/marketing/FAQSection';

const CERTIFICATE_FAQS: FAQEntry[] = [
  {
    question: 'How do I earn my certificate?',
    answer: 'You earn your certificate by completing all course videos and finishing the required class projects.',
  },
  {
    question: 'Do I need to pass an exam?',
    answer: 'No formal exam is required. Your certificate is based on completing the course and projects.',
  },
  {
    question: 'When can I request my certificate?',
    answer: 'You can request your certificate once you have completed all lessons and projects.',
  },
  {
    question: 'Is the certificate recognized?',
    answer: 'Yes, it shows you have completed practical training and can be used to showcase your skills professionally.',
  },
  {
    question: 'How will I receive my certificate?',
    answer: 'Your certificate will be delivered digitally, and you can download or share it anytime.',
  },
];

export const CertificateFAQ = () => (
  <FAQSection
    title="Certificate FAQs"
    items={CERTIFICATE_FAQS}
    sectionClassName="pb-24 pt-0"
  />
);
