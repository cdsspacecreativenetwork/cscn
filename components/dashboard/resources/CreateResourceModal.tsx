'use client';

import React, { useState, useMemo } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, FileText, Loader2, CheckCircle2, Globe, GraduationCap, DollarSign } from 'lucide-react';
import { createMarketplaceResourceAction, updateMarketplaceResourceAction } from '@/actions/marketplace-resources';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { Resource, InstructorCourseOption } from '@/lib/resourceService';

interface CreateResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  instructorCourses: InstructorCourseOption[];
  editingResource?: Resource | null;
}

export const CreateResourceModal: React.FC<CreateResourceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  instructorCourses = [],
  editingResource = null,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<'FILE' | 'LINK' | 'PDF'>('FILE');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  
  // Scope & Course Linking State
  const [isCourseLinked, setIsCourseLinked] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedLessonId, setSelectedLessonId] = useState('');

  // Pricing State
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState('0');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pre-fill form when editingResource changes
  React.useEffect(() => {
    if (editingResource && isOpen) {
      setTitle(editingResource.title || '');
      setDescription(editingResource.description || '');
      setResourceType(editingResource.type || 'FILE');
      if (editingResource.type === 'LINK') {
        setLinkUrl(editingResource.url || '');
      } else {
        setLinkUrl('');
      }
      setThumbnailPreview(editingResource.thumbnail || null);
      setIsCourseLinked(!!editingResource.courseId);
      setSelectedCourseId(editingResource.courseId || '');
      setSelectedModuleId(editingResource.moduleId || '');
      setSelectedLessonId(editingResource.lessonId || '');
      setIsFree(editingResource.isFree ?? true);
      setPrice(editingResource.price ? String(editingResource.price) : '0');
    } else if (!editingResource && isOpen) {
      setTitle('');
      setDescription('');
      setResourceType('FILE');
      setLinkUrl('');
      setFile(null);
      setThumbnail(null);
      setThumbnailPreview(null);
      setIsCourseLinked(false);
      setSelectedCourseId('');
      setSelectedModuleId('');
      setSelectedLessonId('');
      setIsFree(true);
      setPrice('0');
    }
  }, [editingResource, isOpen]);

  // Selected Course & Module computed objects
  const selectedCourse = useMemo(() => {
    return instructorCourses.find((c) => c.id === selectedCourseId);
  }, [instructorCourses, selectedCourseId]);

  const selectedModule = useMemo(() => {
    return selectedCourse?.modules?.find((m) => m.id === selectedModuleId);
  }, [selectedCourse, selectedModuleId]);

  // Options for CustomSelect dropdowns
  const courseOptions = useMemo(() => {
    return [
      { value: '', label: '-- Choose Course --' },
      ...instructorCourses.map((c) => ({
        value: c.id,
        label: c.title,
        icon: <GraduationCap size={16} className="text-[#1C4ED1]" />,
      })),
    ];
  }, [instructorCourses]);

  const moduleOptions = useMemo(() => {
    if (!selectedCourse) return [];
    return [
      { value: '', label: 'All Modules (Whole Course)' },
      ...(selectedCourse.modules || []).map((m) => ({
        value: m.id,
        label: m.title,
      })),
    ];
  }, [selectedCourse]);

  const lessonOptions = useMemo(() => {
    if (!selectedModule) return [];
    return [
      { value: '', label: 'All Lessons (Whole Module)' },
      ...(selectedModule.lessons || []).map((l) => ({
        value: l.id,
        label: l.title,
      })),
    ];
  }, [selectedModule]);

  if (!isOpen) return null;

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList[0]) {
      const selected = fileList[0];
      setThumbnail(selected);
      setThumbnailPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a resource title.');
      return;
    }

    if (resourceType === 'LINK' && !linkUrl.trim()) {
      setErrorMsg('Please enter a valid link URL.');
      return;
    }

    if (!editingResource && resourceType !== 'LINK' && !file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    if (isCourseLinked && !selectedCourseId) {
      setErrorMsg('Please select a course to link this resource to.');
      return;
    }

    if (!isCourseLinked && !isFree && (isNaN(Number(price)) || Number(price) <= 0)) {
      setErrorMsg('Please enter a valid price greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim() || title.trim());
      formData.append('type', resourceType);
      formData.append('category', 'ASSET');
      formData.append('price', (isCourseLinked || isFree) ? '0' : String(price));

      if (resourceType === 'LINK') {
        formData.append('linkUrl', linkUrl.trim());
      } else if (file) {
        formData.append('file', file);
      }

      if (thumbnail) {
        formData.append('thumbnail', thumbnail);
      }

      if (isCourseLinked && selectedCourseId) {
        formData.append('courseId', selectedCourseId);
        if (selectedModuleId) formData.append('moduleId', selectedModuleId);
        if (selectedLessonId) formData.append('lessonId', selectedLessonId);
      }

      const result = editingResource
        ? await updateMarketplaceResourceAction(editingResource.id, formData)
        : await createMarketplaceResourceAction(formData);

      if (result?.error) {
        setErrorMsg(result.error);
      } else {
        setTitle('');
        setDescription('');
        setLinkUrl('');
        setFile(null);
        setThumbnail(null);
        setThumbnailPreview(null);
        setIsCourseLinked(false);
        setSelectedCourseId('');
        setSelectedModuleId('');
        setSelectedLessonId('');
        setIsFree(true);
        setPrice('0');
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save resource. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-[24px] border border-[#E3E8F4] w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl font-jakarta overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#E3E8F4] bg-[#F8FAFC]/50">
          <div>
            <h2 className="text-[22px] font-bold text-[#040B37] leading-tight">Create New Resource</h2>
            <p className="text-[13px] font-medium text-[#9CA3AF]">
              Upload learning materials, downloads, or links for students & course participants
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-[#9CA3AF] hover:text-[#040B37] hover:bg-[#E2E8F0] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {errorMsg && (
            <div className="p-4 rounded-[10px] bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {errorMsg}
            </div>
          )}

          {/* Two-Column Grid */}
          <div className="grid grid-cols-1 gap-8">
            {/* Left Column: Basic Info & Upload Dropzones */}
            <div className="space-y-6">
              {/* Resource Title */}
              <div className="space-y-2">
                <label className="block text-[14px] font-bold text-[#040B37]">
                  Resource Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Design Systems Cheat Sheet & Guidelines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Resource Format Selector */}
              <div className="space-y-2">
                <label className="block text-[14px] font-bold text-[#040B37]">Resource Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      { type: 'FILE', label: 'File / Zip', icon: Upload },
                      { type: 'PDF', label: 'PDF Document', icon: FileText },
                      { type: 'LINK', label: 'Web Link', icon: LinkIcon },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const selected = resourceType === item.type;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setResourceType(item.type);
                          setFile(null);
                          setLinkUrl('');
                        }}
                        className={`flex flex-col items-center justify-center gap-2 p-3.5 rounded-[10px] border text-[13px] font-bold transition-all ${
                          selected
                            ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1] shadow-sm'
                            : 'border-[#E3E8F4] bg-[#F8FAFC] text-[#4B5563] hover:border-[#1C4ED1]/40'
                        }`}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Dropzone / Link URL */}
              {resourceType === 'LINK' ? (
                <div className="space-y-2">
                  <label className="block text-[14px] font-bold text-[#040B37]">
                    External Web URL <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <Input
                      type="url"
                      placeholder="https://figma.com/file/... or https://github.com/..."
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="h-11 pl-11"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-[14px] font-bold text-[#040B37]">
                    Upload File <span className="text-red-500">*</span>
                  </label>
                  <div className="relative border-2 border-dashed border-[#E3E8F4] hover:border-[#1C4ED1] rounded-[14px] p-6 text-center bg-[#F8FAFC] hover:bg-[#1C4ED1]/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="*/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-11 h-11 rounded-full bg-[#1C4ED1]/10 flex items-center justify-center text-[#1C4ED1]">
                        <Upload size={20} />
                      </div>
                      {file ? (
                        <span className="text-[14px] font-bold text-[#1C4ED1] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-[8px] border border-[#1C4ED1]/20 max-w-full overflow-hidden">
                          <CheckCircle2 size={16} className="shrink-0" />
                          <span className="truncate flex-1 min-w-0" title={file.name}>{file.name}</span>
                          <span className="shrink-0 text-xs text-[#9CA3AF]">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </span>
                      ) : (
                        <>
                          <p className="text-[14px] font-bold text-[#040B37]">
                            Click or drag file to upload
                          </p>
                          <p className="text-[12px] font-medium text-[#9CA3AF]">
                            PSD, Figma, AI, CorelDraw, ZIP, PDF, or Document files up to 100MB
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Cover Thumbnail Upload Box (With Drag & Drop Dropzone Styling) */}
              <div className="space-y-2">
                <label className="block text-[14px] font-bold text-[#040B37]">
                  Cover Thumbnail Image (Optional)
                </label>
                <div className="relative border-2 border-dashed border-[#E3E8F4] hover:border-[#1C4ED1] rounded-[14px] p-5 text-center bg-[#F8FAFC] hover:bg-[#1C4ED1]/5 transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  {thumbnailPreview ? (
                    <div className="flex items-center gap-4 text-left">
                      <div className="relative w-16 h-16 rounded-[10px] overflow-hidden border border-[#E3E8F4] shrink-0">
                        <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[14px] font-bold text-[#1C4ED1]">
                          Cover Image Uploaded
                        </p>
                        <p className="text-[12px] text-[#9CA3AF] font-medium">Click or drag a new image to replace</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#F4F6FB] flex items-center justify-center text-[#9CA3AF]">
                        <ImageIcon size={20} />
                      </div>
                      <p className="text-[14px] font-bold text-[#040B37]">
                        Click or drag image to upload cover
                      </p>
                      <p className="text-[12px] font-medium text-[#9CA3AF]">
                        PNG, JPG, or WebP up to 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Description, Pricing & Course Association */}
            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[14px] font-bold text-[#040B37]">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide brief context or instructions for learners downloading this resource..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E3E8F4] rounded-[10px] p-4 text-[14px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10 transition-all resize-none font-medium"
                />
              </div>

              {/* Resource Scope Options (Radio buttons perfectly aligned vertically) */}
              <div className="space-y-3">
                <label className="block text-[14px] font-bold text-[#040B37]">Resource Scope</label>
                <div className="space-y-2.5">
                  {/* Option A: Standalone */}
                  <div
                    onClick={() => {
                      setIsCourseLinked(false);
                      setSelectedCourseId('');
                      setSelectedModuleId('');
                      setSelectedLessonId('');
                    }}
                    className={`flex items-center gap-3.5 p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                      !isCourseLinked
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-sm'
                        : 'border-[#E3E8F4] bg-[#F8FAFC] hover:border-[#1C4ED1]/40'
                    }`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        !isCourseLinked ? 'border-[#1C4ED1] bg-[#1C4ED1]' : 'border-[#9CA3AF]'
                      }`}>
                        {!isCourseLinked && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <Globe size={18} className="text-[#1C4ED1]" />
                      <span className="text-[14px] font-bold text-[#040B37]">Standalone Resource</span>
                    </div>
                  </div>

                  {/* Option B: Course Linked */}
                  <div
                    onClick={() => setIsCourseLinked(true)}
                    className={`flex items-center gap-3.5 p-3.5 rounded-[10px] border cursor-pointer transition-all ${
                      isCourseLinked
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-sm'
                        : 'border-[#E3E8F4] bg-[#F8FAFC] hover:border-[#1C4ED1]/40'
                    }`}
                  >
                    <div className="flex items-center justify-center shrink-0">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isCourseLinked ? 'border-[#1C4ED1] bg-[#1C4ED1]' : 'border-[#9CA3AF]'
                      }`}>
                        {isCourseLinked && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <GraduationCap size={18} className="text-[#1C4ED1]" />
                      <span className="text-[14px] font-bold text-[#040B37]">Link to a Course</span>
                    </div>
                  </div>
                </div>

                {/* Granular Course -> Module -> Lesson Dropdowns using CustomSelect */}
                {isCourseLinked && (
                  <div className="pt-3 space-y-4 animate-fadeIn bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E3E8F4]">
                    {/* Course Dropdown */}
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-bold text-[#040B37]">
                        Select Course <span className="text-red-500">*</span>
                      </label>
                      <CustomSelect
                        options={courseOptions}
                        value={selectedCourseId}
                        onChange={(val) => {
                          setSelectedCourseId(val);
                          setSelectedModuleId('');
                          setSelectedLessonId('');
                        }}
                        placeholder="-- Choose Course --"
                        searchable
                        className="w-full"
                      />
                    </div>

                    {/* Module Dropdown (if course has modules) */}
                    {selectedCourse && selectedCourse.modules && selectedCourse.modules.length > 0 && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-[13px] font-bold text-[#040B37]">
                          Select Module (Optional)
                        </label>
                        <CustomSelect
                          options={moduleOptions}
                          value={selectedModuleId}
                          onChange={(val) => {
                            setSelectedModuleId(val);
                            setSelectedLessonId('');
                          }}
                          placeholder="All Modules (Whole Course)"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Lesson Dropdown (if module selected) */}
                    {selectedModule && selectedModule.lessons && selectedModule.lessons.length > 0 && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-[13px] font-bold text-[#040B37]">
                          Select Lesson (Optional)
                        </label>
                        <CustomSelect
                          options={lessonOptions}
                          value={selectedLessonId}
                          onChange={(val) => setSelectedLessonId(val)}
                          placeholder="All Lessons (Whole Module)"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resource Pricing Option (Free vs Paid) */}
              {!isCourseLinked && (
                <div className="space-y-3 pt-2 border-t border-[#E3E8F4]">
                  <label className="block text-[14px] font-bold text-[#040B37]">Resource Pricing</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFree(true);
                        setPrice('0');
                      }}
                      className={`flex items-center justify-center gap-2 p-3 rounded-[10px] border text-[14px] font-bold transition-all ${
                        isFree
                          ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]'
                          : 'border-[#E3E8F4] bg-[#F8FAFC] text-[#4B5563]'
                      }`}
                    >
                      <span>Free</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFree(false)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-[10px] border text-[14px] font-bold transition-all ${
                        !isFree
                          ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]'
                          : 'border-[#E3E8F4] bg-[#F8FAFC] text-[#4B5563]'
                      }`}
                    >
                      <DollarSign size={16} />
                      <span>Paid</span>
                    </button>
                  </div>

                  {!isFree && (
                    <div className="pt-2 animate-fadeIn space-y-2">
                      <label className="block text-[13px] font-bold text-[#040B37]">
                        Resource Price (NGN) <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 5000 or 100"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-11"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-[#E3E8F4]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-[10px] text-[14px] font-bold text-[#4B5563] hover:bg-[#F4F6FB] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-[10px] bg-[#1C4ED1] hover:bg-[#153eb2] text-white text-[15px] font-bold transition-all shadow-md disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Resource'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
