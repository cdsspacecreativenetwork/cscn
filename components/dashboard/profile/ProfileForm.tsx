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
import { CustomSelect } from '@/components/ui/CustomSelect';
import {
  FALLBACK_LOCATION_TIMEZONE_OPTIONS,
  getLocationTimezoneOption,
  type LocationTimezoneOption,
} from '@/lib/location-timezones';

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

const explicitSocialFields = [
  { name: 'websiteUrl', label: 'Website', placeholder: 'https://your-site.com' },
  { name: 'portfolioUrl', label: 'Portfolio', placeholder: 'https://portfolio.com/you' },
  { name: 'linkedinUrl', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
  { name: 'githubUrl', label: 'GitHub', placeholder: 'https://github.com/you' },
  { name: 'behanceUrl', label: 'Behance', placeholder: 'https://behance.net/you' },
  { name: 'dribbbleUrl', label: 'Dribbble', placeholder: 'https://dribbble.com/you' },
  { name: 'youtubeUrl', label: 'YouTube', placeholder: 'https://youtube.com/@you' },
  { name: 'twitterUrl', label: 'X / Twitter', placeholder: 'https://x.com/you' },
  { name: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/you' },
  { name: 'telegramUrl', label: 'Telegram', placeholder: 'https://t.me/you' },
] as const;

function normalizeExpertise(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function splitExpertise(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}

interface ProfileFormProps {
  user: User;
  locationTimezoneOptions?: LocationTimezoneOption[];
}

export const ProfileForm = ({ user, locationTimezoneOptions = FALLBACK_LOCATION_TIMEZONE_OPTIONS }: ProfileFormProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const lastSavedRef = useRef('');
  const [expertiseText, setExpertiseText] = useState(() => normalizeExpertise(user.expertise).join(', '));
  const normalizedLocationOptions = useMemo(
    () => locationTimezoneOptions.length > 0 ? locationTimezoneOptions : FALLBACK_LOCATION_TIMEZONE_OPTIONS,
    [locationTimezoneOptions]
  );
  const initialLocationOption = useMemo(
    () => getLocationTimezoneOption(user.timezone, user.location, normalizedLocationOptions),
    [normalizedLocationOptions, user.location, user.timezone]
  );
  const locationSelectOptions = useMemo(
    () => normalizedLocationOptions.map((option) => ({
      value: `${option.location}::${option.timezone}`,
      label: `${option.country} - ${option.timezone}`,
    })),
    [normalizedLocationOptions]
  );

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
      location: user.location || initialLocationOption.location,
      timezone: user.timezone || initialLocationOption.timezone,
      yearsExperience: user.yearsExperience ?? undefined,
      websiteUrl: user.websiteUrl || '',
      portfolioUrl: user.portfolioUrl || '',
      linkedinUrl: user.linkedinUrl || '',
      twitterUrl: user.twitterUrl || '',
      instagramUrl: user.instagramUrl || '',
      youtubeUrl: user.youtubeUrl || '',
      githubUrl: user.githubUrl || '',
      behanceUrl: user.behanceUrl || '',
      dribbbleUrl: user.dribbbleUrl || '',
      telegramUrl: user.telegramUrl || '',
      expertise: normalizeExpertise(user.expertise),
      learningFocus: user.learningFocus || '',
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
      expertise: splitExpertise(expertiseText),
      socials: values.socials?.filter(s => s.url.trim() !== "").map(s => ({
        url: s.url,
        platform: getPlatformFromUrl(s.url)
      }))
  }), [expertiseText]);

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
    <form id="profile-form" onSubmit={form.handleSubmit((values) => onSubmit(values))} className="w-full space-y-12 md:space-y-10">
      <div className="w-full md:overflow-hidden md:rounded-[24px] md:border md:border-[#E3E8F4] md:bg-white md:shadow-sm">
        {/* Form Header */}
        <div className="pb-5 md:border-b md:border-[#E3E8F4] md:px-8 md:py-5">
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:p-8 lg:gap-8 lg:p-10">
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

          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-[14px] md:text-[16px] font-semibold text-[#4B5563] tracking-tight">
              Location and timezone
            </label>
            <CustomSelect
              value={`${form.watch('location') || initialLocationOption.location}::${form.watch('timezone') || initialLocationOption.timezone}`}
              options={locationSelectOptions}
              searchable
              searchPlaceholder="Search country or timezone"
              onChange={(value) => {
                const option = normalizedLocationOptions.find((item) => `${item.location}::${item.timezone}` === value);
                if (!option) return;
                form.setValue('location', option.location, { shouldDirty: true, shouldValidate: true });
                form.setValue('timezone', option.timezone, { shouldDirty: true, shouldValidate: true });
              }}
              className="w-full [&>button]:h-[56px] [&>button]:rounded-[16px] [&>button]:border-[#E3E8F4] [&>button]:bg-background [&>button]:px-6 [&>button_span]:text-[15px] md:[&>button_span]:text-[16px]"
            />
            <input type="hidden" {...form.register('location')} />
            <input type="hidden" {...form.register('timezone')} />
            <p className="text-xs font-medium text-[#9CA3AF]">
              This powers your schedule defaults, reminders, and calendar display across CSCN.
            </p>
            {form.formState.errors.location?.message && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.location.message}</p>
            )}
          </div>

          <FormField
            label="Years of experience"
            placeholder="5"
            name="yearsExperience"
            register={(name: string) => form.register(name as any, {
              setValueAs: (value) => value === '' ? undefined : Number(value),
            })}
            type="number"
            error={form.formState.errors.yearsExperience?.message}
          />

          <FormField
            label="Learning focus"
            placeholder="Design systems, product strategy, frontend engineering"
            name="learningFocus"
            register={form.register}
            error={form.formState.errors.learningFocus?.message}
          />

          <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-[14px] md:text-[16px] font-semibold text-[#4B5563] tracking-tight">
              Expertise tags
            </label>
            <input
              value={expertiseText}
              onChange={(event) => {
                const nextValue = event.target.value;
                setExpertiseText(nextValue);
                form.setValue('expertise', splitExpertise(nextValue), { shouldDirty: true, shouldValidate: true });
              }}
              placeholder="UI design, React, Brand strategy"
              className="w-full bg-background border border-[#E3E8F4] rounded-[16px] px-6 h-[56px] text-[15px] md:text-[16px] text-[#040B37] placeholder:text-[#9CA3AF] outline-none focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/5 transition-all shadow-sm font-medium disabled:opacity-50"
            />
            <p className="text-xs font-medium text-[#9CA3AF]">
              Separate tags with commas. These power your public instructor profile and verification readiness.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full md:overflow-hidden md:rounded-[24px] md:border md:border-[#E3E8F4] md:bg-white md:shadow-sm">
        <div className="pb-5 md:border-b md:border-[#E3E8F4] md:px-8 md:py-5">
          <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight font-jakarta">
            Public Profile Links
          </h3>
          <p className="mt-1 text-xs font-semibold text-[#9CA3AF]">
            Use explicit links so the public profile can render the correct social icons.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:p-8 lg:p-10">
          {explicitSocialFields.map((field) => (
            <FormField
              key={field.name}
              label={field.label}
              placeholder={field.placeholder}
              name={field.name}
              register={form.register}
              error={form.formState.errors[field.name]?.message}
            />
          ))}
        </div>
      </div>

      {/* Dynamic Social Links Section */}
      <div className="w-full md:overflow-hidden md:rounded-[24px] md:border md:border-[#E3E8F4] md:bg-white md:shadow-sm">
        <div className="flex items-center justify-between gap-4 pb-5 md:border-b md:border-[#E3E8F4] md:px-8 md:py-5">
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

        <div className="md:p-8 lg:p-10">
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
