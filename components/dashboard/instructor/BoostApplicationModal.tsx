'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Loader2, X, Link as LinkIcon, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { uploadAvatar } from '@/actions/upload';
import { boostInstructorApplicationAction } from '@/actions/instructor-verification';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function BoostApplicationModal({ isOpen, onClose }: Props) {
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeName, setResumeName] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [boostNote, setBoostNote] = useState('');
  const [certLink, setCertLink] = useState('');
  const [certificationLinks, setCertificationLinks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    setIsUploadingResume(true);
    setResumeName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await uploadAvatar(formData);

      if (res.error) {
        toast.error(res.error);
        setResumeName('');
      } else if (res.url) {
        setResumeUrl(res.url);
        toast.success('CV/Resume uploaded successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload file.');
      setResumeName('');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const addCertLink = () => {
    if (!certLink.trim()) return;
    if (!certLink.startsWith('http://') && !certLink.startsWith('https://')) {
      toast.error('Please enter a valid URL (starting with https://)');
      return;
    }
    setCertificationLinks((prev) => [...prev, certLink.trim()]);
    setCertLink('');
  };

  const removeCertLink = (index: number) => {
    setCertificationLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await boostInstructorApplicationAction({
        resumeUrl: resumeUrl || undefined,
        boostNote: boostNote.trim() || undefined,
        certificationLinks: certificationLinks.length > 0 ? certificationLinks : undefined,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success || 'Application boosted successfully!');
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while boosting your application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040B37]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-[20px] p-6 shadow-2xl border border-[#E3E8F4] space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#040B37] transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF3FF] text-[#1C4ED1] rounded-full text-[12px] font-bold">
            🚀 Fast-Track Review
          </span>
          <h2 className="text-[20px] font-bold text-[#040B37]">Boost Your Application</h2>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            Provide additional proof of experience to help our admin team review and approve your instructor application faster.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Resume Upload */}
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold text-[#040B37]">
              Upload CV / Resume (Optional)
            </label>
            <div className="relative border-2 border-dashed border-[#CBD5E1] rounded-[14px] p-4 text-center hover:border-[#1C4ED1] transition-colors bg-[#F8FAFC]">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploadingResume}
              />
              <div className="flex flex-col items-center justify-center gap-2">
                {isUploadingResume ? (
                  <Loader2 size={24} className="animate-spin text-[#1C4ED1]" />
                ) : resumeUrl ? (
                  <div className="flex items-center gap-2 text-emerald-600 font-medium text-[13px]">
                    <FileText size={18} />
                    <span className="truncate max-w-[220px]">{resumeName || 'CV Uploaded'}</span>
                    <CheckCircle2 size={16} />
                  </div>
                ) : (
                  <>
                    <Upload size={22} className="text-[#1C4ED1]" />
                    <p className="text-[13px] font-medium text-[#4B5563]">
                      Click or drag PDF / Word document (Max 10MB)
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Certification Links */}
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold text-[#040B37]">
              External Certifications & Work Proof Links
            </label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://coursera.org/verify/... or GitHub / Dribbble"
                value={certLink}
                onChange={(e) => setCertLink(e.target.value)}
                className="h-11 text-[13px]"
              />
              <Button
                type="button"
                onClick={addCertLink}
                variant="outline"
                size="sm"
                className="h-11 px-4 text-[13px] shrink-0"
              >
                Add Link
              </Button>
            </div>
            {certificationLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {certificationLinks.map((link, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4F6FB] border border-[#E3E8F4] rounded-full text-[12px] text-[#040B37] font-medium max-w-[280px] truncate"
                  >
                    <LinkIcon size={12} className="text-[#1C4ED1] shrink-0" />
                    <span className="truncate">{link}</span>
                    <button
                      type="button"
                      onClick={() => removeCertLink(idx)}
                      className="text-[#9CA3AF] hover:text-red-500 cursor-pointer ml-1"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Pitch / Boost Note */}
          <div className="space-y-2">
            <label className="block text-[14px] font-semibold text-[#040B37]">
              Note to Reviewing Admin
            </label>
            <Textarea
              rows={3}
              placeholder="Tell us about the first course or topic you plan to teach on CSCN..."
              value={boostNote}
              onChange={(e) => setBoostNote(e.target.value)}
              className="text-[13px]"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={isSubmitting}
            >
              Submit Boost Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
