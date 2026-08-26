'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Sparkles, Check, ArrowRight, ArrowLeft, ShieldCheck, X, Upload, Link as LinkIcon, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type BecomeInstructorModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function BecomeInstructorModal({
  open,
  onClose,
  onSuccess,
}: BecomeInstructorModalProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: session?.user?.name || '',
    email: session?.user?.email || '',
    industry: 'UI/UX Design',
    yearsExperience: '3-5 years',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    courseTopic: '',
    teachingPitch: '',
    agreedToTerms: false,
  });

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.portfolioUrl && !formData.linkedinUrl) {
      setErrorMsg('Please provide at least one portfolio or LinkedIn profile link.');
      return;
    }

    if (!formData.courseTopic.trim()) {
      setErrorMsg('Please provide a course or teaching topic concept.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/instructors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to submit instructor application');
      }

      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#040B37]/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-xl overflow-hidden rounded-[24px] bg-white p-6 sm:p-8 shadow-2xl border border-[#E3E8F4]"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-[#9CA3AF] hover:text-[#040B37] hover:bg-[#F4F6FB] transition-colors"
          >
            <X size={18} />
          </button>

          {success ? (
            /* Success View */
            <div className="flex flex-col items-center text-center py-6 gap-4">
              <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center">
                <Check size={32} strokeWidth={2.5} />
              </div>
              <h2 className="text-[24px] font-bold text-[#040B37]">Application Submitted! 🎉</h2>
              <p className="text-[14px] text-[#4B5563] max-w-md leading-relaxed">
                Thank you for applying to become a CSCN Verified Instructor & Mentor. Our admissions team is reviewing your portfolio (Est. 24–48 hrs).
              </p>
              <div className="rounded-[16px] bg-[#F8FAFC] border border-[#E3E8F4] p-4 text-left w-full text-[13px] text-[#4B5563] space-y-1.5 mt-2">
                <p className="font-semibold text-[#040B37] flex items-center gap-2">
                  <Sparkles size={16} className="text-[#1C4ED1]" /> What happens next?
                </p>
                <p>• You have been granted <strong>Draft Sandbox Access</strong> to the Instructor Studio.</p>
                <p>• You can start creating course outlines while your identity is verified.</p>
              </div>
              <Button
                variant="default"
                size="md"
                rounded="full"
                onClick={onClose}
                className="mt-4 px-8 py-2.5 text-[14px] font-bold"
              >
                Back to Mentorship
              </Button>
            </div>
          ) : (
            /* Wizard Form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col gap-1 pr-8">
                <div className="flex items-center gap-2 text-[12px] font-bold text-[#1C4ED1] uppercase tracking-wider">
                  <Sparkles size={14} /> Step {step} of 3
                </div>
                <h2 className="text-[22px] sm:text-[24px] font-bold text-[#040B37] tracking-[-0.02em] font-inter">
                  {step === 1 && 'Domain & Industry Experience'}
                  {step === 2 && 'Proof of Work & Portfolio'}
                  {step === 3 && 'Course Concept & Pitch'}
                </h2>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#F4F6FB] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#1C4ED1] h-full transition-all duration-300 ease-out"
                  style={{ width: `${(step / 3) * 100}%` }}
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3.5 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[13px] font-medium">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Step 1 Content */}
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-[#040B37]">Full Name</label>
                      <Input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="h-10 text-[13px] bg-[#F8FAFC]"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12px] font-semibold text-[#040B37]">Work Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="h-10 text-[13px] bg-[#F8FAFC]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">Primary Industry / Field</label>
                    <select
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                      className="h-10 px-3 text-[13px] bg-[#F8FAFC] border border-[#E3E8F4] rounded-lg outline-none focus:border-[#1C4ED1]"
                    >
                      <option value="UI/UX Design">UI/UX Design & Product Design</option>
                      <option value="Software Engineering">Software Engineering & Architecture</option>
                      <option value="Product Management">Product Management & Growth</option>
                      <option value="AI / Data Science">AI, Machine Learning & Data Science</option>
                      <option value="DevOps & Cyber Security">DevOps & Cloud Security</option>
                      <option value="Digital Marketing">Digital Marketing & Brand Strategy</option>
                      <option value="Motion Design">Motion Design & 3D Animation</option>
                      <option value="Founder / Executive">Founder & Executive Leadership</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">Years of Industry Experience</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['1-2 years', '3-5 years', '6-10 years', '10+ years'].map((exp) => (
                        <button
                          key={exp}
                          type="button"
                          onClick={() => setFormData({ ...formData, yearsExperience: exp })}
                          className={`py-2 px-3 text-[12px] font-medium rounded-lg border text-center transition-all ${
                            formData.yearsExperience === exp
                              ? 'border-[#1C4ED1] bg-[#1C4ED1]/10 text-[#1C4ED1] font-bold'
                              : 'border-[#E3E8F4] bg-[#F8FAFC] text-[#4B5563]'
                          }`}
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2 Content */}
              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37] flex items-center justify-between">
                      <span>Portfolio / Website URL</span>
                      <span className="text-[11px] font-normal text-[#9CA3AF]">Required</span>
                    </label>
                    <div className="relative">
                      <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <Input
                        type="url"
                        placeholder="https://behance.net/yourprofile or personal site"
                        value={formData.portfolioUrl}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        className="pl-9 h-10 text-[13px] bg-[#F8FAFC]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">LinkedIn Profile URL</label>
                    <div className="relative">
                      <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <Input
                        type="url"
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        className="pl-9 h-10 text-[13px] bg-[#F8FAFC]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">GitHub / Dribbble Profile URL (Optional)</label>
                    <div className="relative">
                      <LinkIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <Input
                        type="url"
                        placeholder="https://github.com/yourhandle"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        className="pl-9 h-10 text-[13px] bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 Content */}
              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">Proposed First Course / Masterclass Topic</label>
                    <Input
                      type="text"
                      placeholder="e.g., Advanced Figma Design Systems & Token Architecture"
                      value={formData.courseTopic}
                      onChange={(e) => setFormData({ ...formData, courseTopic: e.target.value })}
                      required
                      className="h-10 text-[13px] bg-[#F8FAFC]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-semibold text-[#040B37]">Short Pitch & Instructor Overview</label>
                    <textarea
                      rows={3}
                      placeholder="Briefly describe what students will build/accomplish and your teaching background..."
                      value={formData.teachingPitch}
                      onChange={(e) => setFormData({ ...formData, teachingPitch: e.target.value })}
                      className="p-3 text-[13px] bg-[#F8FAFC] border border-[#E3E8F4] rounded-lg outline-none focus:border-[#1C4ED1] resize-none"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.agreedToTerms}
                      onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                      required
                      className="mt-0.5 h-4 w-4 rounded border-[#C8D1E0] text-[#1C4ED1] focus:ring-[#1C4ED1]"
                    />
                    <span className="text-[12px] text-[#4B5563] leading-relaxed">
                      I agree to the CSCN Quality Guidelines, Instructor Code of Ethics, and Platform Payout Terms.
                    </span>
                  </label>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#E3E8F4]">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                    leftIcon={<ArrowLeft size={16} />}
                    className="text-[13px] font-bold text-[#4B5563]"
                  >
                    Back
                  </Button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    variant="default"
                    size="md"
                    rounded="full"
                    onClick={() => setStep((s) => (s + 1) as 2 | 3)}
                    rightIcon={<ArrowRight size={16} />}
                    className="px-6 py-2.5 text-[14px] font-bold ml-auto"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="gradient"
                    size="md"
                    rounded="full"
                    disabled={isSubmitting || !formData.agreedToTerms}
                    className="px-7 py-2.5 text-[14px] font-bold ml-auto"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                )}
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
