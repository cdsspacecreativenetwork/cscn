import type { Metadata } from 'next';
import LegalLayout, { type LegalSection } from '@/components/marketing/LegalLayout';

export const metadata: Metadata = {
  title: 'Terms of Service — CSCN',
  description:
    'Read the Terms of Service that govern your use of the CSCN learning platform, including course access, payments, intellectual property, and user conduct.',
};

const SECTIONS: LegalSection[] = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'account', label: 'Account Registration' },
  { id: 'platform-use', label: 'Use of the Platform' },
  { id: 'courses', label: 'Course Enrollment & Access' },
  { id: 'payments', label: 'Payments & Refunds' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'user-content', label: 'User-Generated Content' },
  { id: 'conduct', label: 'Prohibited Conduct' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'termination', label: 'Suspension & Termination' },
  { id: 'disclaimer', label: 'Disclaimers' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'contact', label: 'Contact Us' },
];

const h2 = 'text-[22px] font-semibold text-[#040B37] tracking-tight mb-4 mt-1';
const h3 = 'text-[17px] font-semibold text-[#040B37] mb-2 mt-6';
const p = 'text-[15px] text-[#4B5563] leading-[1.8] mb-4';
const ul = 'space-y-2 mb-5 ml-1';
const li = 'flex gap-3 text-[15px] text-[#4B5563] leading-[1.8]';
const dot = 'mt-[10px] w-1.5 h-1.5 rounded-full bg-[#1C4ED1] shrink-0';
const section = 'mb-12 pb-12 border-b border-[#F4F6FB] last:border-0 last:mb-0 last:pb-0 scroll-mt-[100px]';

export default function TermsPage() {
  return (
    <LegalLayout
      badge="Legal"
      title="Terms of Service"
      lastUpdated="May 10, 2026"
      intro="These Terms of Service govern your access to and use of the CSCN platform, including all courses, tools, community features, and content. By creating an account or accessing any part of the platform, you agree to be bound by these terms."
      sections={SECTIONS}
    >
      {/* 1 */}
      <section id="acceptance" className={section}>
        <h2 className={h2}>1. Acceptance of Terms</h2>
        <p className={p}>
          These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you
          (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and CSCN (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), governing your access to
          and use of the CSCN website, mobile applications, and all associated services (collectively, the
          &ldquo;Platform&rdquo;).
        </p>
        <p className={p}>
          By registering for an account, enrolling in a course, or otherwise accessing any portion of the
          Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms,
          our Privacy Policy, and any additional policies referenced herein. If you do not agree to these
          Terms, you must not access or use the Platform.
        </p>
        <p className={p}>
          If you are accessing the Platform on behalf of an organisation, you represent and warrant that
          you have the authority to bind that organisation to these Terms, and references to &ldquo;you&rdquo;
          include both you individually and the organisation.
        </p>
      </section>

      {/* 2 */}
      <section id="account" className={section}>
        <h2 className={h2}>2. Account Registration &amp; Security</h2>
        <p className={p}>
          To access most features of the Platform, you must register for an account. You agree to provide
          accurate, current, and complete information during registration and to keep that information up
          to date.
        </p>
        <h3 className={h3}>Eligibility</h3>
        <p className={p}>
          You must be at least 16 years of age to create an account. If you are under 18, you confirm
          that a parent or legal guardian has reviewed and agreed to these Terms on your behalf. We
          reserve the right to verify your age and to close accounts that do not meet this requirement.
        </p>
        <h3 className={h3}>Account Security</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} />You are responsible for maintaining the confidentiality of your login credentials.</li>
          <li className={li}><span className={dot} />You must not share your account with any other person or allow others to access your account.</li>
          <li className={li}><span className={dot} />You must notify us immediately at <a href="mailto:security@cscn.com" className="text-[#1C4ED1] hover:underline">security@cscn.com</a> if you suspect any unauthorised use of your account.</li>
          <li className={li}><span className={dot} />We are not liable for any loss or damage arising from your failure to protect your account credentials.</li>
        </ul>
        <h3 className={h3}>One Account Per Person</h3>
        <p className={p}>
          Each person may maintain only one active account. Creating multiple accounts to circumvent
          suspensions, access free trial periods repeatedly, or for any other reason is prohibited and
          may result in termination of all associated accounts.
        </p>
      </section>

      {/* 3 */}
      <section id="platform-use" className={section}>
        <h2 className={h2}>3. Use of the Platform</h2>
        <p className={p}>
          Subject to these Terms, CSCN grants you a limited, non-exclusive, non-transferable, revocable
          licence to access and use the Platform for your personal, non-commercial learning purposes.
        </p>
        <h3 className={h3}>Permitted Use</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} />Browse and enrol in available courses and learning paths.</li>
          <li className={li}><span className={dot} />Stream or download course materials as permitted by each course.</li>
          <li className={li}><span className={dot} />Participate in community forums, discussions, and mentorship programmes.</li>
          <li className={li}><span className={dot} />Earn and share certificates of completion for courses you have finished.</li>
        </ul>
        <h3 className={h3}>Restrictions</h3>
        <p className={p}>
          You may not access the Platform through automated means, resell or sub-licence access to
          others, reverse-engineer any part of the Platform, or use the Platform for any commercial
          purpose without our prior written consent.
        </p>
      </section>

      {/* 4 */}
      <section id="courses" className={section}>
        <h2 className={h2}>4. Course Enrollment &amp; Access</h2>
        <p className={p}>
          When you enrol in a course, CSCN grants you a limited, personal, non-transferable licence to
          access that course content for the duration specified at the time of purchase, or for the life
          of your active subscription where applicable.
        </p>
        <h3 className={h3}>Lifetime Access</h3>
        <p className={p}>
          Where a course is sold with &ldquo;lifetime access,&rdquo; this refers to the lifetime of the course on
          the Platform. CSCN reserves the right to retire, update, or remove course content. We will
          provide reasonable advance notice before retiring a course you have purchased.
        </p>
        <h3 className={h3}>Course Updates</h3>
        <p className={p}>
          Instructors and CSCN may update course content to keep it current. Significant structural
          changes to a course will be communicated to enrolled learners. Minor updates (corrections,
          additions, re-ordering) may be made without notice.
        </p>
        <h3 className={h3}>Certificates</h3>
        <p className={p}>
          Certificates of completion are issued upon satisfying all course requirements. They are
          intended as a record of your learning and do not constitute professional qualifications or
          accreditation unless explicitly stated. CSCN makes no representation that certificates will be
          recognised by any third party, employer, or regulatory body.
        </p>
      </section>

      {/* 5 */}
      <section id="payments" className={section}>
        <h2 className={h2}>5. Payments, Subscriptions &amp; Refunds</h2>
        <h3 className={h3}>Pricing</h3>
        <p className={p}>
          All prices are displayed in the currency applicable to your region and are inclusive of any
          applicable taxes unless otherwise stated. CSCN reserves the right to change pricing at any
          time; changes will not affect active subscription periods already paid for.
        </p>
        <h3 className={h3}>Subscriptions</h3>
        <p className={p}>
          Subscription plans renew automatically at the end of each billing cycle unless you cancel
          before the renewal date. You authorise CSCN to charge the payment method on file at the
          start of each new billing period. You can manage or cancel your subscription at any time
          from your account settings.
        </p>
        <h3 className={h3}>Refund Policy</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} />Individual course purchases: you may request a full refund within 14 days of purchase, provided you have not completed more than 20% of the course.</li>
          <li className={li}><span className={dot} />Subscription plans: you may cancel at any time. No pro-rata refund is issued for the unused portion of the current billing period unless required by applicable law.</li>
          <li className={li}><span className={dot} />Refunds are not available for courses purchased at a promotional price of 80% or more off the standard rate.</li>
        </ul>
        <p className={p}>
          To request a refund, contact <a href="mailto:support@cscn.com" className="text-[#1C4ED1] hover:underline">support@cscn.com</a> with
          your order reference. Approved refunds are processed within 5–10 business days to your
          original payment method.
        </p>
      </section>

      {/* 6 */}
      <section id="ip" className={section}>
        <h2 className={h2}>6. Intellectual Property</h2>
        <h3 className={h3}>CSCN Content</h3>
        <p className={p}>
          All content on the Platform — including course videos, audio, written materials, graphics,
          logos, software, and the Platform itself — is the property of CSCN or its licensors and is
          protected by copyright, trademark, and other intellectual property laws. Nothing in these
          Terms transfers any ownership rights to you.
        </p>
        <h3 className={h3}>Instructor Content</h3>
        <p className={p}>
          Course content created by independent instructors remains the intellectual property of those
          instructors, subject to the licence they have granted CSCN to host and distribute that
          content on the Platform.
        </p>
        <h3 className={h3}>Prohibited Actions</h3>
        <ul className={ul}>
          <li className={li}><span className={dot} />You must not download, copy, reproduce, distribute, broadcast, or resell any course content without explicit written authorisation.</li>
          <li className={li}><span className={dot} />You must not remove or alter any copyright, trademark, or other proprietary notices on Platform content.</li>
          <li className={li}><span className={dot} />You must not create derivative works from Platform content without prior written consent.</li>
        </ul>
      </section>

      {/* 7 */}
      <section id="user-content" className={section}>
        <h2 className={h2}>7. User-Generated Content</h2>
        <p className={p}>
          The Platform may allow you to post, upload, or share content such as course reviews,
          community forum posts, project submissions, and profile information (&ldquo;User Content&rdquo;).
        </p>
        <h3 className={h3}>Licence to CSCN</h3>
        <p className={p}>
          By submitting User Content, you grant CSCN a worldwide, royalty-free, perpetual, irrevocable,
          non-exclusive licence to use, reproduce, modify, adapt, publish, translate, distribute, and
          display that content in connection with operating and promoting the Platform.
        </p>
        <h3 className={h3}>Your Responsibility</h3>
        <p className={p}>
          You are solely responsible for all User Content you submit. You represent and warrant that
          you own or have the necessary rights to the content you post, that your content does not
          infringe any third-party rights, and that it complies with these Terms and applicable law.
        </p>
        <p className={p}>
          CSCN reserves the right to remove any User Content that violates these Terms or that we
          consider inappropriate, at our sole discretion and without prior notice.
        </p>
      </section>

      {/* 8 */}
      <section id="conduct" className={section}>
        <h2 className={h2}>8. Prohibited Conduct</h2>
        <p className={p}>
          You agree not to engage in any of the following while using the Platform:
        </p>
        <ul className={ul}>
          <li className={li}><span className={dot} />Violating any applicable local, national, or international law or regulation.</li>
          <li className={li}><span className={dot} />Harassing, threatening, or intimidating other users, instructors, or CSCN staff.</li>
          <li className={li}><span className={dot} />Posting or sharing content that is defamatory, obscene, hateful, discriminatory, or otherwise offensive.</li>
          <li className={li}><span className={dot} />Impersonating any person or entity, or falsely claiming an affiliation with CSCN.</li>
          <li className={li}><span className={dot} />Using the Platform to distribute spam, unsolicited messages, or promotional material.</li>
          <li className={li}><span className={dot} />Attempting to gain unauthorised access to any part of the Platform or other users&apos; accounts.</li>
          <li className={li}><span className={dot} />Introducing malware, viruses, or any code intended to disrupt or damage the Platform.</li>
          <li className={li}><span className={dot} />Scraping, crawling, or using automated tools to extract data from the Platform without our written consent.</li>
          <li className={li}><span className={dot} />Circumventing or disabling any digital rights management or security features of the Platform.</li>
          <li className={li}><span className={dot} />Sharing login credentials or course content with individuals who have not purchased or enrolled.</li>
        </ul>
        <p className={p}>
          Violations may result in immediate account suspension or termination, removal of content,
          and where appropriate, referral to law enforcement authorities.
        </p>
      </section>

      {/* 9 */}
      <section id="third-party" className={section}>
        <h2 className={h2}>9. Third-Party Services</h2>
        <p className={p}>
          The Platform may integrate with or link to third-party services, including payment processors,
          social login providers (Google, LinkedIn), analytics tools, and video hosting infrastructure.
          These services are governed by their own terms and privacy policies, which we encourage you
          to review.
        </p>
        <p className={p}>
          CSCN is not responsible for the practices, content, or reliability of any third-party services.
          Your use of third-party integrations is at your own risk, and any dispute arising from those
          services must be directed to the relevant third party.
        </p>
      </section>

      {/* 10 */}
      <section id="termination" className={section}>
        <h2 className={h2}>10. Suspension &amp; Termination</h2>
        <h3 className={h3}>Termination by You</h3>
        <p className={p}>
          You may close your account at any time from your account settings or by contacting us at
          <a href="mailto:support@cscn.com" className="text-[#1C4ED1] hover:underline ml-1">support@cscn.com</a>.
          Closing your account does not entitle you to a refund except as described in Section 5.
        </p>
        <h3 className={h3}>Termination by CSCN</h3>
        <p className={p}>
          We reserve the right to suspend or permanently terminate your account, without prior notice
          or liability, if we reasonably believe you have violated these Terms or engaged in conduct
          that is harmful to the Platform, its users, or CSCN. Upon termination, your licence to
          access the Platform ceases immediately.
        </p>
        <h3 className={h3}>Effect of Termination</h3>
        <p className={p}>
          Sections relating to intellectual property, disclaimers, limitation of liability, governing
          law, and any accrued payment obligations survive termination of these Terms.
        </p>
      </section>

      {/* 11 */}
      <section id="disclaimer" className={section}>
        <h2 className={h2}>11. Disclaimers</h2>
        <p className={p}>
          THE PLATFORM AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES
          OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR UNINTERRUPTED
          OR ERROR-FREE OPERATION.
        </p>
        <p className={p}>
          CSCN does not warrant that course content is accurate, complete, current, or suitable for
          any particular purpose. Learning outcomes vary between individuals and depend on factors
          beyond our control. We make no guarantee that completion of any course will result in
          employment, certification recognition, or specific skill acquisition.
        </p>
      </section>

      {/* 12 */}
      <section id="liability" className={section}>
        <h2 className={h2}>12. Limitation of Liability</h2>
        <p className={p}>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, CSCN AND ITS DIRECTORS, EMPLOYEES,
          AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA,
          GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF
          OR INABILITY TO USE THE PLATFORM.
        </p>
        <p className={p}>
          IN NO EVENT SHALL CSCN&apos;S TOTAL CUMULATIVE LIABILITY TO YOU FOR ALL CLAIMS RELATING TO
          THE PLATFORM EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO CSCN IN THE TWELVE (12)
          MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED US DOLLARS (USD $100).
        </p>
        <p className={p}>
          Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability,
          so the above limitations may not apply to you in full. In such cases, liability is limited to
          the minimum extent permitted by applicable law.
        </p>
      </section>

      {/* 13 */}
      <section id="governing-law" className={section}>
        <h2 className={h2}>13. Governing Law &amp; Dispute Resolution</h2>
        <p className={p}>
          These Terms are governed by and construed in accordance with the laws of the Federal
          Republic of Nigeria, without regard to its conflict-of-law principles. Any dispute, controversy,
          or claim arising out of or relating to these Terms or the Platform shall first be subject to
          informal resolution: you must contact us at{' '}
          <a href="mailto:legal@cscn.com" className="text-[#1C4ED1] hover:underline">legal@cscn.com</a>{' '}
          and allow 30 days for good-faith resolution before initiating any formal proceedings.
        </p>
        <p className={p}>
          If informal resolution fails, disputes shall be resolved by binding arbitration in accordance
          with applicable arbitration rules, except that either party may seek injunctive or other
          equitable relief in a court of competent jurisdiction to prevent irreparable harm pending
          arbitration. You agree to resolve disputes individually and waive any right to class-action
          proceedings.
        </p>
      </section>

      {/* 14 */}
      <section id="changes" className={section}>
        <h2 className={h2}>14. Changes to These Terms</h2>
        <p className={p}>
          We may update these Terms from time to time to reflect changes in our services, legal
          requirements, or business practices. When we make material changes, we will notify you by
          email or by displaying a prominent notice on the Platform at least 14 days before the
          changes take effect.
        </p>
        <p className={p}>
          Your continued use of the Platform after the effective date of updated Terms constitutes
          your acceptance of the changes. If you do not agree to the updated Terms, you must stop
          using the Platform and close your account.
        </p>
      </section>

      {/* 15 */}
      <section id="contact" className={section}>
        <h2 className={h2}>15. Contact Us</h2>
        <p className={p}>
          If you have questions about these Terms, please reach out to us. We aim to respond to all
          legal enquiries within 5 business days.
        </p>
        <div className="bg-[#F4F6FB] rounded-[12px] border border-[#E3E8F4] p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">Legal enquiries</span>
            <a href="mailto:legal@cscn.com" className="text-[14px] text-[#1C4ED1] hover:underline underline-offset-2">legal@cscn.com</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">General support</span>
            <a href="mailto:support@cscn.com" className="text-[14px] text-[#1C4ED1] hover:underline underline-offset-2">support@cscn.com</a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
            <span className="text-[14px] font-semibold text-[#040B37] w-[120px] shrink-0">Postal address</span>
            <span className="text-[14px] text-[#4B5563]">CSCN Learning Ltd, Lagos, Nigeria</span>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
