import type { Metadata } from 'next';
import LegalLayout, { type LegalSection } from '@/components/marketing/LegalLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy — CSCN',
  description:
    'Learn how CSCN collects, uses, and protects your personal data when you use our learning platform.',
};

const SECTIONS: LegalSection[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'information-collected', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'information-sharing', label: 'Information Sharing' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights & Choices' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'international', label: 'International Transfers' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
];

const h2 = 'text-[22px] font-semibold text-[#040B37] tracking-tight mb-4 mt-1';
const h3 = 'text-[17px] font-semibold text-[#040B37] mb-2 mt-6';
const p = 'text-[15px] text-[#4B5563] leading-[1.8] mb-4';
const ul = 'space-y-2 mb-5 ml-1';
const li = 'flex gap-3 text-[15px] text-[#4B5563] leading-[1.8]';
const dot = 'mt-[10px] w-1.5 h-1.5 rounded-full bg-[#1C4ED1] shrink-0';
const section = 'mb-12 pb-12 border-b border-[#F4F6FB] last:border-0 last:mb-0 last:pb-0 scroll-mt-[100px]';

export default function PrivacyPage() {
  return (
    <LegalLayout
      badge="Legal"
      title="Privacy Policy"
      lastUpdated="May 10, 2026"
      intro="Your privacy matters to us. This Privacy Policy explains what personal data CSCN collects when you use our platform, how we use and protect it, and the choices and rights you have regarding your information."
      sections={SECTIONS}
    >
      {/* 1 */}
      <section id="overview" className={section}>
        <h2 className={h2}>1. Overview</h2>
        <p className={p}>
          CSCN (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is the data controller for the personal information
          collected through the CSCN learning platform, website, and associated applications
          (collectively, the &ldquo;Platform&rdquo;). This Privacy Policy applies to all users of the Platform,
          including learners, instructors, and visitors.
        </p>
        <p className={p}>
          We are committed to handling your personal data transparently and responsibly. Where
          applicable, we comply with the Nigeria Data Protection Act (NDPA), the EU General Data
          Protection Regulation (GDPR), and the California Consumer Privacy Act (CCPA).
        </p>
        <div className="bg-[#EFF3FF] rounded-[12px] border border-[#C8D1E0] px-6 py-5">
          <p className="text-[14px] font-semibold text-[#040B37] mb-1">The short version</p>
          <p className="text-[14px] text-[#4B5563] leading-relaxed">
            We collect the data you give us and data we generate as you use the Platform. We use it
            to deliver and improve our service, not to sell it to advertisers. You can control, export,
            or delete your data at any time.
          </p>
        </div>
      </section>

      {/* 2 */}
      <section id="information-collected" className={section}>
        <h2 className={h2}>2. Information We Collect</h2>
        <h3 className={h3}>Information You Provide Directly</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Account data:</strong> name, email address, password (hashed), and profile picture when you register.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Profile information:</strong> bio, location, professional title, and social links if you choose to add them.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Payment data:</strong> billing address and payment card details (processed directly by our payment provider; we do not store full card numbers).</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Communications:</strong> messages you send to our support team, community posts, course reviews, and feedback.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">User content:</strong> project submissions, forum contributions, and any other content you upload.</li>
        </ul>
        <h3 className={h3}>Information Collected Automatically</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Usage data:</strong> pages visited, courses viewed, lessons completed, time spent, and feature interactions.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Device &amp; technical data:</strong> IP address, browser type and version, operating system, device identifiers, and referring URLs.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Learning progress:</strong> quiz scores, lesson completion status, certificate issuance records, and course progress.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Cookie data:</strong> session tokens, preference settings, and analytics identifiers (see Section 5).</li>
        </ul>
        <h3 className={h3}>Information from Third Parties</h3>
        <p className={p}>
          If you sign in using Google or LinkedIn, we receive your name, email address, and profile
          picture from those providers, subject to the permissions you grant. We do not receive your
          password from these providers.
        </p>
      </section>

      {/* 3 */}
      <section id="how-we-use" className={section}>
        <h2 className={h2}>3. How We Use Your Information</h2>
        <p className={p}>
          We use the information we collect for the following purposes, each grounded in a lawful
          basis under applicable data protection law:
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Service delivery:</strong> creating and managing your account, processing enrolments and payments, providing access to courses, and issuing certificates.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Personalisation:</strong> recommending courses, tracking your learning progress, and tailoring your dashboard experience.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Communication:</strong> sending transactional emails (receipts, account activity, security alerts) and, where you have opted in, promotional content and product updates.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Platform improvement:</strong> analysing usage patterns, conducting research, and improving the quality and features of the Platform.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Safety &amp; compliance:</strong> detecting and preventing fraud, abuse, or illegal activity; enforcing our Terms of Service; and meeting legal obligations.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Support:</strong> responding to your enquiries, resolving technical issues, and providing customer assistance.</li>
        </ul>
        <p className={p}>
          We do not sell your personal data to third parties for their own marketing purposes.
        </p>
      </section>

      {/* 4 */}
      <section id="information-sharing" className={section}>
        <h2 className={h2}>4. Information Sharing</h2>
        <p className={p}>
          We share personal data only in the limited circumstances described below:
        </p>
        <h3 className={h3}>Service Providers</h3>
        <p className={p}>
          We share data with trusted third-party vendors who assist us in operating the Platform,
          including cloud infrastructure providers, payment processors, email delivery services,
          analytics providers, and customer support tools. These parties are contractually bound to
          process data only on our instructions and may not use it for their own purposes.
        </p>
        <h3 className={h3}>Instructors</h3>
        <p className={p}>
          If you are enrolled in a course, the instructor may see aggregate enrolment statistics and,
          where you have submitted work for review, your username and submission. Instructors do not
          have access to your payment details, email address, or private account information.
        </p>
        <h3 className={h3}>Legal Requirements</h3>
        <p className={p}>
          We may disclose your information to law enforcement, regulators, or courts when required by
          applicable law, when we believe disclosure is necessary to protect the rights, property, or
          safety of CSCN, our users, or the public, or to enforce our Terms of Service.
        </p>
        <h3 className={h3}>Business Transfers</h3>
        <p className={p}>
          In the event of a merger, acquisition, or sale of all or part of CSCN&apos;s assets, your data
          may be transferred to the acquiring entity. We will provide notice before your data is
          transferred and becomes subject to a different privacy policy.
        </p>
      </section>

      {/* 5 */}
      <section id="cookies" className={section}>
        <h2 className={h2}>5. Cookies &amp; Tracking Technologies</h2>
        <p className={p}>
          We use cookies and similar technologies (local storage, pixels) to operate and improve the
          Platform. These are categorised as follows:
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Strictly necessary:</strong> session authentication cookies required for the Platform to function. Cannot be disabled.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Functional:</strong> cookies that remember your preferences (language, theme, last-viewed course) to improve your experience.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Analytics:</strong> cookies from tools such as our internal analytics and Vercel Web Analytics that help us understand how users interact with the Platform. Data is aggregated and anonymised.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Marketing:</strong> we do not currently use advertising cookies or cross-site tracking cookies.</li>
        </ul>
        <p className={p}>
          You can control non-essential cookies through the cookie preferences panel available in
          your account settings or via your browser settings. Note that disabling certain cookies may
          affect Platform functionality.
        </p>
      </section>

      {/* 6 */}
      <section id="data-security" className={section}>
        <h2 className={h2}>6. Data Security</h2>
        <p className={p}>
          We implement industry-standard technical and organisational measures to protect your
          personal data against unauthorised access, loss, destruction, or alteration. These
          measures include:
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} />Encryption of data in transit using TLS 1.2 or higher.</li>
          <li className={li}><span className={dot} />Passwords stored as salted, one-way cryptographic hashes — we cannot read your password.</li>
          <li className={li}><span className={dot} />Access controls ensuring only authorised CSCN personnel can access production data.</li>
          <li className={li}><span className={dot} />Regular security assessments and dependency audits.</li>
          <li className={li}><span className={dot} />Database hosted on Neon PostgreSQL with encrypted storage and automated backups.</li>
        </ul>
        <p className={p}>
          No method of transmission or storage is 100% secure. If you believe your account has been
          compromised, please contact us immediately at{' '}
          <a href="mailto:security@cscn.com" className="text-[#1C4ED1] hover:underline">security@cscn.com</a>.
        </p>
      </section>

      {/* 7 */}
      <section id="data-retention" className={section}>
        <h2 className={h2}>7. Data Retention</h2>
        <p className={p}>
          We retain your personal data for as long as your account is active or as needed to provide
          the Platform, comply with legal obligations, resolve disputes, and enforce our agreements.
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Account data:</strong> retained for the lifetime of your account plus 90 days after account deletion, to allow for account recovery requests.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Purchase records:</strong> retained for a minimum of 7 years to comply with financial and tax regulations.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Learning progress &amp; certificates:</strong> retained for the lifetime of your account. Certificate records may be retained indefinitely to allow verification by third parties.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Support communications:</strong> retained for 2 years after the resolution of the issue.</li>
        </ul>
        <p className={p}>
          When data is no longer needed, it is securely deleted or anonymised.
        </p>
      </section>

      {/* 8 */}
      <section id="your-rights" className={section}>
        <h2 className={h2}>8. Your Rights &amp; Choices</h2>
        <p className={p}>
          Depending on your location, you may have the following rights regarding your personal data.
          We will respond to all verified requests within 30 days.
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Access:</strong> request a copy of the personal data we hold about you.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Correction:</strong> request that we correct inaccurate or incomplete data. You can update most account information directly in your profile settings.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Deletion:</strong> request deletion of your personal data. Note that we may retain certain data as required by law or for legitimate business purposes (e.g., financial records).</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Portability:</strong> request your data in a structured, machine-readable format for transfer to another service.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Objection:</strong> object to processing based on legitimate interests, including profiling.</li>
          <li className={li}><span className={dot} /><strong className="text-[#040B37]">Withdrawal of consent:</strong> where processing is based on your consent (e.g., marketing emails), you may withdraw consent at any time via your notification preferences or by unsubscribing.</li>
        </ul>
        <p className={p}>
          To exercise any of these rights, submit a request to{' '}
          <a href="mailto:privacy@cscn.com" className="text-[#1C4ED1] hover:underline">privacy@cscn.com</a>.
          We may need to verify your identity before processing the request.
        </p>
      </section>

      {/* 9 */}
      <section id="children" className={section}>
        <h2 className={h2}>9. Children&apos;s Privacy</h2>
        <p className={p}>
          The Platform is not directed at children under the age of 16. We do not knowingly collect
          personal data from anyone under 16. If we become aware that we have inadvertently collected
          data from a child under 16, we will promptly delete that information.
        </p>
        <p className={p}>
          If you are a parent or guardian and believe your child has provided us with personal
          information, please contact us at{' '}
          <a href="mailto:privacy@cscn.com" className="text-[#1C4ED1] hover:underline">privacy@cscn.com</a>{' '}
          and we will take steps to remove that data promptly.
        </p>
      </section>

      {/* 10 */}
      <section id="international" className={section}>
        <h2 className={h2}>10. International Data Transfers</h2>
        <p className={p}>
          CSCN operates globally and your data may be transferred to, stored, and processed in
          countries outside your country of residence, including the United States, where our cloud
          infrastructure providers operate. These countries may have different data protection laws
          than your home country.
        </p>
        <p className={p}>
          Where we transfer data from the European Economic Area (EEA) or the United Kingdom to
          countries not deemed adequate by the relevant authorities, we rely on Standard Contractual
          Clauses (SCCs) approved by the European Commission as the appropriate transfer mechanism.
          You may request a copy of applicable SCCs by contacting us at{' '}
          <a href="mailto:privacy@cscn.com" className="text-[#1C4ED1] hover:underline">privacy@cscn.com</a>.
        </p>
      </section>

      {/* 11 */}
      <section id="changes" className={section}>
        <h2 className={h2}>11. Changes to This Policy</h2>
        <p className={p}>
          We may update this Privacy Policy periodically to reflect changes in our practices,
          technology, legal requirements, or other factors. When we make material changes, we will
          notify you via email or a prominent notice on the Platform at least 14 days before the
          updated policy takes effect.
        </p>
        <p className={p}>
          The &ldquo;Last updated&rdquo; date at the top of this page indicates when the policy was most
          recently revised. We encourage you to review this policy periodically. Your continued use
          of the Platform after the effective date of changes constitutes acceptance of the updated policy.
        </p>
      </section>

      {/* 12 */}
      <section id="contact" className={section}>
        <h2 className={h2}>12. Contact Us</h2>
        <p className={p}>
          If you have questions, concerns, or requests relating to this Privacy Policy or the handling
          of your personal data, please reach out to us. We aim to respond within 5 business days.
        </p>
        <div className="bg-[#F4F6FB] rounded-[12px] border border-[#E3E8F4] p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">Privacy enquiries</span>
            <a href="mailto:privacy@cscn.com" className="text-[14px] text-[#1C4ED1] hover:underline underline-offset-2">privacy@cscn.com</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">Security issues</span>
            <a href="mailto:security@cscn.com" className="text-[14px] text-[#1C4ED1] hover:underline underline-offset-2">security@cscn.com</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">Data controller</span>
            <span className="text-[14px] text-[#4B5563]">CSCN Learning Ltd, Lagos, Nigeria</span>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
