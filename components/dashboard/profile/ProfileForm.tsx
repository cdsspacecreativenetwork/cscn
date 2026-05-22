'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SettingsSchema } from '@/schemas';
import { settings } from '@/actions/settings';
import { User } from '@prisma/client';
import { toast } from 'sonner';
import { Plus, Trash2, Link as LinkIcon, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FormField = ({ 
  label, 
  placeholder, 
  name, 
  register, 
  error, 
  type = "text", 
  className = "",
  disabled = false
}: { 
  label: string; 
  placeholder: string; 
  name: string;
  register: any;
  error?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    <label className="text-[14px] md:text-[16px] font-semibold text-[#4B5563] tracking-tight">
      {label}
    </label>
    {type === "textarea" ? (
      <textarea 
        {...register(name)}
        placeholder={placeholder}
        rows={4}
        disabled={disabled}
        className="w-full bg-background border border-[#E3E8F4] rounded-[16px] p-4 text-[15px] md:text-[16px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all shadow-sm resize-none font-medium disabled:opacity-50"
      />
    ) : (
      <input 
        {...register(name)}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full bg-background border border-[#E3E8F4] rounded-[16px] px-6 h-[56px] text-[15px] md:text-[16px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all shadow-sm font-medium disabled:opacity-50"
      />
    )}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Helper to detect platform from URL
const getPlatformFromUrl = (url: string) => {
  if (!url) return "website";
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com")) return "twitter";
  if (lowerUrl.includes("linkedin.com")) return "linkedin";
  if (lowerUrl.includes("github.com")) return "github";
  if (lowerUrl.includes("behance.net")) return "behance";
  if (lowerUrl.includes("dribbble.com")) return "dribbble";
  if (lowerUrl.includes("youtube.com")) return "youtube";
  return "website";
};

// Helper to render platform icon
const uPlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "twitter": return <LinkIcon size={18} className="text-[#1DA1F2]" />;
    case "linkedin": return <LinkIcon size={18} className="text-[#0A66C2]" />;
    case "github": return <LinkIcon size={18} className="text-[#181717]" />;
    default: return <Globe size={18} className="text-[#9CA3AF]" />;
  }
};

interface ProfileFormProps {
  user: User;
}

export const ProfileForm = ({ user }: ProfileFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const lastSavedRef = useRef('');

  // Parse existing socials safely, or provide defaults
  const defaultSocials = React.useMemo(() => {
    let parsed = [];
    if (user.socials) {
      try {
        parsed = typeof user.socials === 'string' ? JSON.parse(user.socials) : user.socials;
      } catch (e) {
        parsed = [];
      }
    }
    
    // Ensure we always have empty inputs for LinkedIn and Twitter if empty
    if (parsed.length === 0) {
      return [
        { platform: "linkedin", url: "" },
        { platform: "twitter", url: "" }
      ];
    }
    return parsed;
  }, [user.socials]);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      firstName: user.firstName || (user.name ? user.name.split(' ')[0] : ''),
      lastName: user.lastName || (user.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
      bio: user.bio || '',
      headline: user.headline || '',
      location: user.location || '',
      socials: defaultSocials,
    }
  });

  const { isDirty } = form.formState;
  const watchedValues = form.watch();

  // Sync external save button state
  useEffect(() => {
    const btn = document.getElementById('save-profile-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = !isDirty || isPending;
      btn.textContent = isPending ? 'Saving...' : isDirty ? 'Save Now' : 'Saved';
    }
  }, [isDirty, isPending]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "socials",
  });

  const processValues = useCallback((values: z.infer<typeof SettingsSchema>) => ({
      ...values,
      socials: values.socials?.filter(s => s.url.trim() !== "").map(s => ({
        url: s.url,
        platform: getPlatformFromUrl(s.url)
      }))
  }), []);

  const defaultSignature = useMemo(() => JSON.stringify(processValues(form.getValues())), [form, processValues]);

  useEffect(() => {
    lastSavedRef.current = defaultSignature;
  }, [defaultSignature]);

  const saveProfile = useCallback((values: z.infer<typeof SettingsSchema>, showToast = false) => {
    const processedValues = processValues(values);
    const signature = JSON.stringify(processedValues);
    if (signature === lastSavedRef.current && !showToast) return;

    setSaveStatus('saving');
    startTransition(() => {
      settings(processedValues)
        .then((data) => {
          if (data.error) {
            setSaveStatus('error');
            toast.error(data.error);
            return;
          }
          if (data.success) {
            lastSavedRef.current = signature;
            setSaveStatus('saved');
            if (showToast) toast.success("Profile updated successfully");
            if (JSON.stringify(processValues(form.getValues())) === signature) {
              form.reset(values); // Reset to clear isDirty state only when no newer edits exist.
            }
            router.refresh(); // Refresh to update external Server Components (like Navbar)
          }
        })
        .catch(() => {
          setSaveStatus('error');
          toast.error("Something went wrong!");
        });
    });
  }, [form, processValues, router]);

  useEffect(() => {
    if (isDirty) setSaveStatus('dirty');
    if (!isDirty || isPending) return;

    const id = window.setTimeout(() => {
      form.handleSubmit((values) => saveProfile(values, false))();
    }, 1500);

    return () => window.clearTimeout(id);
  }, [form, isDirty, isPending, saveProfile, watchedValues]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => saveProfile(values, true);

  const saveStatusLabel =
    isPending || saveStatus === 'saving' ? 'Saving changes...' :
    saveStatus === 'saved' ? 'All changes saved' :
    saveStatus === 'error' ? 'Autosave failed. Use Save Now.' :
    isDirty || saveStatus === 'dirty' ? 'Autosaving shortly...' :
    'All changes saved';

  return (
    <form id="profile-form" onSubmit={form.handleSubmit((values) => onSubmit(values))} className="w-full space-y-10">
      <div className="w-full bg-white border border-[#E3E8F4] rounded-[24px] overflow-hidden shadow-sm">
        {/* Form Header */}
        <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8">
          <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
            Personal Information
          </h3>
          <p className={`mt-1 text-xs font-bold ${
            saveStatus === 'error' ? 'text-red-500' :
            isPending || saveStatus === 'saving' ? 'text-[#1C4ED1]' :
            'text-[#9CA3AF]'
          }`}>
            {saveStatusLabel}
          </p>
        </div>

        {/* Form Grid */}
        <div className="p-6 md:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <FormField 
            label="First name" 
            placeholder="Chris" 
            name="firstName"
            register={form.register}
            error={form.formState.errors.firstName?.message}
          />
          <FormField 
            label="Last name" 
            placeholder="John" 
            name="lastName"
            register={form.register}
            error={form.formState.errors.lastName?.message}
          />
          
          <FormField 
            className='md:col-span-2 '
            label="Professional Headline" 
            placeholder="e.g. Senior Product Designer" 
            name="headline"
            register={form.register}
            error={form.formState.errors.headline?.message}
          />

          <FormField 
            className='md:col-span-2 '
            label="Bio" 
            placeholder="Tell us about yourself..." 
            name="bio"
            register={form.register}
            type="textarea"
            error={form.formState.errors.bio?.message}
          />

          <FormField 
            className='md:col-span-2 '
            label="Location" 
            placeholder="City, Country" 
            name="location"
            register={form.register}
            error={form.formState.errors.location?.message}
          />
        </div>
      </div>

      {/* Dynamic Social Links Section */}
      <div className="w-full bg-white border border-[#E3E8F4] rounded-[24px] overflow-hidden shadow-sm">
        <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8 flex items-center justify-between">
          <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
            Social Links
          </h3>
          <button
            type="button"
            onClick={() => append({ platform: "website", url: "" })}
            className="flex items-center gap-2 text-[14px] font-bold text-[#1C4ED1] hover:text-[#163BB1] transition-colors"
          >
            <Plus size={16} />
            Add Link
          </button>
        </div>

        <div className="p-6 md:p-8 lg:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((field, index) => {
              // Get current value to detect platform for icon
              const currentUrl = form.watch(`socials.${index}.url`);
              const platform = getPlatformFromUrl(currentUrl ?? '');

              return (
                <div key={field.id} className="flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                  {/* <div className="w-[56px] h-[56px] rounded-[16px] bg-[#F4F6FB] flex items-center justify-center shrink-0 border border-[#E3E8F4]">
                    <PlatformIcon platform={platform} />
                  </div> */}
                  
                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      {...form.register(`socials.${index}.url` as const)}
                      placeholder={`https://${platform === 'website' ? '...' : platform + '.com/...'}`}
                      className="w-full bg-background border border-[#E3E8F4] rounded-[16px] px-6 h-[56px] text-[15px] md:text-[16px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all shadow-sm font-medium disabled:opacity-50"
                    />
                    {form.formState.errors.socials?.[index]?.url && (
                      <p className="text-red-500 text-xs ml-2">
                        {form.formState.errors.socials[index]?.url?.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-[56px] h-[56px] flex items-center justify-center text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 rounded-[16px] transition-colors shrink-0"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </form>
  );
};
