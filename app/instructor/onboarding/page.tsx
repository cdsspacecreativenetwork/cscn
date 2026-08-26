'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Upload, Check, ArrowRight, ArrowLeft, User as UserIcon, AlertCircle, ChevronDown, ExternalLink, Plus, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { WORLD_COUNTRIES } from '@/lib/countries';
import { EXPERTISE_CATEGORIES, INDUSTRY_SECTORS } from '@/lib/categories';

const LOCAL_STORAGE_KEY = 'cscn_instructor_onboarding_draft';

// Sample disciplines list
const DISCIPLINE_OPTIONS = [
  'Graphic Design',
  'Product Design',
  'UI/UX Design',
  'Frontend Engineering',
  'Backend Architecture',
  'Fullstack Engineering',
  'Mobile UX',
  'AI / Machine Learning',
  'Data Science & Analytics',
  'Design Systems',
  'User Research & Testing',
  'Brand Strategy',
  'Product Management',
  'Technical Writing',
  'DevOps & Security',
];

// Sample tools list
const TOOL_OPTIONS = [
  'Figma',
  'React',
  'Next.js',
  'TypeScript',
  'Framer',
  'Tailwind CSS',
  'Node.js',
  'Python',
  'Postman',
  'Docker',
  'Git / GitHub',
  'Webflow',
  'Notion',
  'Jira',
  'Slack',
];

// Animation variants for Framer Motion staggered entrance
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
} as const;

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
} as const;

export default function InstructorOnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Wizard Step State (7 Steps Total)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [isNavigating, setIsNavigating] = useState(false);

  // Step 1 Form State
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | ''>('');
  const [country, setCountry] = useState<string>('');
  const [countryOpen, setCountryOpen] = useState(false);

  // Step 2 Form State (ADPList Style)
  const [company, setCompany] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [expYears, setExpYears] = useState<string>('');
  const [expMonths, setExpMonths] = useState<string>('');
  const [linkedinHandle, setLinkedinHandle] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');

  // Step 3 Form State ("Great! What's your superpower?")
  const [primaryExpertise, setPrimaryExpertise] = useState<string>('');
  const [showSecondaryExpertise, setShowSecondaryExpertise] = useState(false);
  const [secondaryExpertise, setSecondaryExpertise] = useState<string>('');
  const [industrySector, setIndustrySector] = useState<string>('');
  const [industryOpen, setIndustryOpen] = useState(false);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);

  // Step 4 Form State ("Almost there! How would you like to be intro'd?")
  const [bio, setBio] = useState<string>('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState('');

  // Step 5 Form State (Udemy: "Share your knowledge")
  const [teachingExperience, setTeachingExperience] = useState<string>('');

  // Step 6 Form State (Udemy: "Create a course")
  const [videoReadiness, setVideoReadiness] = useState<string>('');

  // Step 7 Form State (Udemy: "Expand your reach")
  const [audienceSize, setAudienceSize] = useState<string>('');
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  // Lock body scroll when any dropdown / popover is open
  useEffect(() => {
    if (countryOpen || industryOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [countryOpen, industryOpen]);

  // 1. Load saved draft from localStorage or session on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.profilePhotoUrl) setProfilePhotoUrl(parsed.profilePhotoUrl);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.gender) setGender(parsed.gender);
        if (parsed.country) setCountry(parsed.country);
        if (parsed.company) setCompany(parsed.company);
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
        if (parsed.expYears) setExpYears(parsed.expYears);
        if (parsed.expMonths) setExpMonths(parsed.expMonths);
        if (parsed.linkedinHandle) setLinkedinHandle(parsed.linkedinHandle);
        if (parsed.portfolioUrl) setPortfolioUrl(parsed.portfolioUrl);
        if (parsed.primaryExpertise) setPrimaryExpertise(parsed.primaryExpertise);
        if (parsed.secondaryExpertise) {
          setSecondaryExpertise(parsed.secondaryExpertise);
          setShowSecondaryExpertise(true);
        }
        if (parsed.industrySector) setIndustrySector(parsed.industrySector);
        if (parsed.selectedDisciplines) setSelectedDisciplines(parsed.selectedDisciplines);
        if (parsed.selectedTools) setSelectedTools(parsed.selectedTools);
        if (parsed.bio) setBio(parsed.bio);
        if (parsed.teachingExperience) setTeachingExperience(parsed.teachingExperience);
        if (parsed.videoReadiness) setVideoReadiness(parsed.videoReadiness);
        if (parsed.audienceSize) setAudienceSize(parsed.audienceSize);
        if (parsed.currentStep && (parsed.currentStep >= 1 && parsed.currentStep <= 7)) {
          setCurrentStep(parsed.currentStep as 1 | 2 | 3 | 4 | 5 | 6 | 7);
        }
      }
    } catch (e) {
      console.error('Failed to parse onboarding draft:', e);
    }
  }, []);

  // 2. Pre-fill full name from registered account session if still empty
  useEffect(() => {
    if (!fullName && session?.user?.name) {
      setFullName(session.user.name);
    }
    if (!profilePhotoUrl && session?.user?.image) {
      setProfilePhotoUrl(session.user.image);
    }
  }, [session, fullName, profilePhotoUrl]);

  // 3. Auto-detect country based on browser timezone if unselected
  useEffect(() => {
    if (!country) {
      try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timeZone.includes('Lagos')) setCountry('Nigeria');
        else if (timeZone.includes('London')) setCountry('United Kingdom');
        else if (timeZone.includes('New_York') || timeZone.includes('America')) setCountry('United States');
        else if (timeZone.includes('Toronto')) setCountry('Canada');
        else if (timeZone.includes('Berlin')) setCountry('Germany');
        else if (timeZone.includes('Paris')) setCountry('France');
        else if (timeZone.includes('India') || timeZone.includes('Kolkata')) setCountry('India');
      } catch (err) {
        console.error('Timezone auto-detect error:', err);
      }
    }
  }, [country]);

  // 4. Save progress automatically to localStorage whenever fields update
  useEffect(() => {
    try {
      const draftData = {
        profilePhotoUrl,
        fullName,
        gender,
        country,
        company,
        jobTitle,
        expYears,
        expMonths,
        linkedinHandle,
        portfolioUrl,
        primaryExpertise,
        secondaryExpertise,
        industrySector,
        selectedDisciplines,
        selectedTools,
        bio,
        teachingExperience,
        videoReadiness,
        audienceSize,
        currentStep,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftData));
    } catch (e) {
      console.error('Failed to save onboarding draft:', e);
    }
  }, [profilePhotoUrl, fullName, gender, country, company, jobTitle, expYears, expMonths, linkedinHandle, portfolioUrl, primaryExpertise, secondaryExpertise, industrySector, selectedDisciplines, selectedTools, bio, teachingExperience, videoReadiness, audienceSize, currentStep]);

  // File upload handler with strict 2MB validation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError('');
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setPhotoError('File size exceeds the 2MB limit. Please upload a smaller photo.');
        return;
      }
      const url = URL.createObjectURL(file);
      setProfilePhotoUrl(url);
    }
  };

  // Groq AI Bio Enhancer Handler
  const handleEnhanceBio = async () => {
    setIsEnhancing(true);
    setEnhanceError('');
    try {
      const res = await fetch('/api/ai/enhance-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBio: bio,
          fullName: fullName || session?.user?.name,
          jobTitle,
          company,
          expYears,
          country,
          primaryExpertise,
          secondaryExpertise,
          industrySector,
          disciplines: selectedDisciplines,
          tools: selectedTools,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to enhance bio');
      }

      const data = await res.json();
      if (data.enhancedBio) {
        setBio(data.enhancedBio);
      }
    } catch (err) {
      console.error(err);
      setEnhanceError('Could not enhance bio. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Final Submission Handler (Step 7)
  const handleFinalSubmit = async () => {
    setIsSubmittingFinal(true);
    setIsNavigating(true);

    try {
      const res = await fetch('/api/instructor/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profilePhotoUrl,
          fullName,
          gender,
          country,
          company,
          jobTitle,
          expYears,
          expMonths,
          linkedinHandle,
          portfolioUrl,
          primaryExpertise,
          secondaryExpertise,
          industrySector,
          selectedDisciplines,
          selectedTools,
          bio,
          teachingExperience,
          videoReadiness,
          audienceSize,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save onboarding');
      }

      localStorage.removeItem(LOCAL_STORAGE_KEY);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      router.push('/dashboard');
    } finally {
      setIsSubmittingFinal(false);
      setIsNavigating(false);
    }
  };

  // Toggle discipline selection
  const toggleDiscipline = (discipline: string) => {
    if (selectedDisciplines.includes(discipline)) {
      setSelectedDisciplines((prev) => prev.filter((d) => d !== discipline));
    } else {
      setSelectedDisciplines((prev) => [...prev, discipline]);
    }
  };

  // Toggle tool selection
  const toggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools((prev) => prev.filter((t) => t !== tool));
    } else {
      setSelectedTools((prev) => [...prev, tool]);
    }
  };

  const isStep1Valid = fullName.trim().length > 0 && gender !== '' && country !== '';
  const isStep2Valid = company.trim().length > 0 && jobTitle.trim().length > 0 && expYears !== '' && expMonths !== '' && linkedinHandle.trim().length > 0;
  const isStep3Valid = primaryExpertise !== '' && industrySector !== '' && selectedDisciplines.length > 0 && selectedTools.length > 0;
  const isStep4Valid = bio.trim().length >= 10;
  const isStep5Valid = teachingExperience !== '';
  const isStep6Valid = videoReadiness !== '';
  const isStep7Valid = audienceSize !== '';

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(2); setIsNavigating(false); }, 150);
    } else if (currentStep === 2 && isStep2Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(3); setIsNavigating(false); }, 150);
    } else if (currentStep === 3 && isStep3Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(4); setIsNavigating(false); }, 150);
    } else if (currentStep === 4 && isStep4Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(5); setIsNavigating(false); }, 150);
    } else if (currentStep === 5 && isStep5Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(6); setIsNavigating(false); }, 150);
    } else if (currentStep === 6 && isStep6Valid) {
      setIsNavigating(true);
      setTimeout(() => { setCurrentStep(7); setIsNavigating(false); }, 150);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setIsNavigating(true);
      setTimeout(() => {
        setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7);
        setIsNavigating(false);
      }, 150);
    }
  };

  // Clean expertise list excluding quick filters
  const validExpertiseCategories = EXPERTISE_CATEGORIES.filter(
    (c) => c.id !== 'all' && c.id !== 'new' && c.id !== 'asap' && c.id !== 'notable'
  );

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFC] flex flex-col justify-between font-inter text-[#040B37]">
      {/* Top Edge Progress Bar Loader during navigation */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-[#1C4ED1] z-50 animate-pulse transition-all duration-300" />
      )}

      {/* Top Navigation Header */}
      <header className="w-full max-w-5xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-center">
        <Link href="/">
          <Image
            src="/images/logo.svg"
            alt="CSCN Logo"
            width={110}
            height={32}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </header>

      {/* Main Full-Width Stage (Clean Container: No Box Background, No Shadow, No Border) */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-8 py-8 sm:py-14 flex flex-col justify-center">
        <div className="flex items-center gap-3 py-4">
          <span className="text-base font-normal text-[#6B7280] tracking-wider">
            Step {currentStep} of 7
          </span>
        </div>
        <div className="w-full flex flex-col gap-6 sm:gap-8">
          {/* STEP 1: Origin Story & Personal Profile */}
          {currentStep === 1 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step Title */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Hello! What’s your origin story?
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280]">
                  Set up your personal instructor profile to start sharing your expertise.
                </p>
              </motion.div>

              {/* Profile Photo Uploader */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
                <label className="text-base font-semibold text-[#040B37]">
                  Upload profile photo <span className="text-[#1C4ED1]">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-full bg-[#F4F6FB] border-2 border-dashed border-[#C8D1E0] overflow-hidden flex items-center justify-center shrink-0">
                    {profilePhotoUrl ? (
                      <Image
                        src={profilePhotoUrl}
                        alt="Profile Photo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <UserIcon size={32} className="text-[#9CA3AF]" />
                    )}
                  </div>

                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-[#E3E8F4] bg-white hover:bg-[#F4F6FB] cursor-pointer transition-colors text-[13px] font-semibold text-[#1C4ED1]">
                    <Upload size={15} />
                    <span>Select a file</span>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[12px] text-[#9CA3AF]">Make sure the file is below 2MB (JPG, PNG, or WEBP)</p>

                {photoError && (
                  <div className="flex items-center gap-2 p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[12px] font-medium">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{photoError}</span>
                  </div>
                )}

                {/* ADPList Style Success Tip Banner */}
                <div className="mt-1 flex items-start gap-2.5 p-3.5 rounded-[16px] bg-[#1C4ED1]/5 border border-[#1C4ED1]/20 text-[12px] text-[#1C4ED1] font-medium leading-relaxed">
                  <Check size={16} className="shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>With a clearer picture, your instructor profile and course applications have a higher chance of approval.</span>
                </div>
              </motion.div>

              {/* Full Name Input */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Your full name <span className="text-[#1C4ED1]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Enter first and last name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12 text-base bg-[#F8FAFC] border-[#E3E8F4] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1C4ED1] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-[14px]"
                />
              </motion.div>

              {/* Gender ShadCN Select (Male or Female ONLY) */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  What gender do you identify as? <span className="text-[#1C4ED1]">*</span>
                </label>
                <Select value={gender} onValueChange={(val) => setGender(val as 'Male' | 'Female')}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Country Searchable ShadCN Combobox */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Which country do you live in? <span className="text-[#1C4ED1]">*</span>
                </label>

                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={countryOpen}
                      className={`flex h-12 w-full items-center justify-between rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] px-4 py-3 text-base focus:border-[#1C4ED1] focus:outline-none focus:ring-0 outline-none cursor-pointer transition-colors ${country ? 'font-medium text-[#040B37]' : 'font-normal text-[#9CA3AF]'
                        }`}
                    >
                      <span className="truncate">
                        {country ? country : 'Select country'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." className="text-base" />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {WORLD_COUNTRIES.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={(currentValue) => {
                                setCountry(currentValue);
                                setCountryOpen(false);
                              }}
                              className="flex items-center justify-between text-base"
                            >
                              <span>{c}</span>
                              {country === c && (
                                <Check className="h-4 w-4 text-[#1C4ED1]" strokeWidth={2.5} />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </motion.div>

              {/* Step 1 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <Link
                  href="/onboarding/intent"
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Link>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep1Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep1Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 2: Professional Background (ADPList Style) */}
          {currentStep === 2 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 2 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Love it! Tell us more about what you do.
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280]">
                  Share your current organization and professional experience.
                </p>
              </motion.div>

              {/* Field 1: Company / School */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Company/School <span className="text-[#1C4ED1]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Eg. Apple, UCLA, Freelance, etc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-12 text-base bg-[#F8FAFC] border-[#E3E8F4] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1C4ED1] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-[14px]"
                />
              </motion.div>

              {/* Field 2: Your Title */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Your title <span className="text-[#1C4ED1]">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Eg. Product Designer, Student, Senior Software Engineer, etc."
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-12 text-base bg-[#F8FAFC] border-[#E3E8F4] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1C4ED1] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-[14px]"
                />
              </motion.div>

              {/* Field 3: Years & Months of Experience */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Years of professional experience <span className="text-[#1C4ED1]">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Years Select */}
                  <Select value={expYears} onValueChange={(val) => setExpYears(val)}>
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Years" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 31 }, (_, i) => (
                        <SelectItem key={i} value={`${i}`}>
                          {i} {i === 1 ? 'Year' : 'Years'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Months Select */}
                  <Select value={expMonths} onValueChange={(val) => setExpMonths(val)}>
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Months" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i} value={`${i}`}>
                          {i} {i === 1 ? 'Month' : 'Months'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>

              {/* Field 4: LinkedIn URL */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  LinkedIn URL label <span className="text-[#1C4ED1]">*</span>
                </label>
                <div className="flex items-center rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] overflow-hidden focus-within:border-[#1C4ED1] transition-all">
                  <span className="px-4 py-3 bg-[#EAEFF8]/60 text-[14px] font-medium text-[#6B7280] border-r border-[#E3E8F4] shrink-0 select-none">
                    linkedin.com/in/
                  </span>
                  <Input
                    type="text"
                    placeholder="username"
                    value={linkedinHandle}
                    onChange={(e) => setLinkedinHandle(e.target.value.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''))}
                    className="h-12 border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:border-0 rounded-none text-base outline-none focus:outline-none"
                  />
                </div>
                <a
                  href="https://www.linkedin.com/in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-lg font-medium text-[#1C4ED1] hover:underline pt-1"
                >
                  <span>Get your linkedin URL</span>
                  <ExternalLink size={13} />
                </a>
              </motion.div>

              {/* Field 5: Portfolio or Website URL (Optional) */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Portfolio or Website URL <span className="text-[#6B7280] font-normal">(Optional)</span>
                </label>
                <Input
                  type="url"
                  placeholder="https://myportfolio.com or https://dribbble.com/username"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="h-12 text-base bg-[#F8FAFC] border-[#E3E8F4] placeholder:text-[#9CA3AF] placeholder:font-normal focus:border-[#1C4ED1] outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 rounded-[14px]"
                />
              </motion.div>

              {/* Step 2 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep2Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep2Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 3: "Great! What’s your superpower?" (ADPList Style) */}
          {currentStep === 3 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 3 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Great! What’s your superpower?
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280]">
                  Select your primary expertise, industry, disciplines, and tools.
                </p>
              </motion.div>

              {/* Field 1: Primary Expertise */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Select primary expertise <span className="text-[#1C4ED1]">*</span>
                </label>
                <Select value={primaryExpertise} onValueChange={(val) => setPrimaryExpertise(val)}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Eg: Design, Product, Engineering" />
                  </SelectTrigger>
                  <SelectContent>
                    {validExpertiseCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.label}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>

              {/* Secondary Expertise Trigger or Dropdown */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                {!showSecondaryExpertise ? (
                  <button
                    type="button"
                    onClick={() => setShowSecondaryExpertise(true)}
                    className="w-full h-12 rounded-[14px] border border-dashed border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[14px] font-semibold text-[#040B37] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Plus size={16} className="text-[#1C4ED1]" />
                    <span>Add secondary expertise</span>
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-base font-semibold text-[#040B37]">
                        Secondary expertise <span className="text-[#6B7280] font-normal">(Optional)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSecondaryExpertise('');
                          setShowSecondaryExpertise(false);
                        }}
                        className="text-[12px] font-semibold text-[#EF4444] hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                    <Select value={secondaryExpertise} onValueChange={(val) => setSecondaryExpertise(val)}>
                      <SelectTrigger className="w-full h-12 text-base">
                        <SelectValue placeholder="Select secondary expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        {validExpertiseCategories
                          .filter((c) => c.label !== primaryExpertise)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.label}>
                              {cat.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </motion.div>

              {/* Field 2: Industry Sector */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37]">
                  Which industry sector do you work in? <span className="text-[#1C4ED1]">*</span>
                </label>

                <Popover open={industryOpen} onOpenChange={setIndustryOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      role="combobox"
                      aria-expanded={industryOpen}
                      className={`flex h-12 w-full items-center justify-between rounded-[14px] border border-[#E3E8F4] bg-[#F8FAFC] px-4 py-3 text-base focus:border-[#1C4ED1] focus:outline-none focus:ring-0 outline-none cursor-pointer transition-colors ${industrySector ? 'font-medium text-[#040B37]' : 'font-normal text-[#9CA3AF]'
                        }`}
                    >
                      <span className="truncate">
                        {industrySector ? industrySector : 'Select industry sector'}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-[#9CA3AF]" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search industry..." className="text-base" />
                      <CommandList>
                        <CommandEmpty>No industry found.</CommandEmpty>
                        <CommandGroup>
                          {INDUSTRY_SECTORS.map((sector) => (
                            <CommandItem
                              key={sector.id}
                              value={sector.label}
                              onSelect={(currentValue) => {
                                setIndustrySector(currentValue);
                                setIndustryOpen(false);
                              }}
                              className="flex items-center justify-between text-base"
                            >
                              <span>{sector.label}</span>
                              {industrySector === sector.label && (
                                <Check className="h-4 w-4 text-[#1C4ED1]" strokeWidth={2.5} />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </motion.div>

              {/* Field 3: Which disciplines are relevant in your expertise(s)? */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
                <label className="text-base font-semibold text-[#040B37]">
                  Which disciplines are relevant in your expertise(s)? <span className="text-[#1C4ED1]">*</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {DISCIPLINE_OPTIONS.map((discipline) => {
                    const isSelected = selectedDisciplines.includes(discipline);
                    return (
                      <button
                        key={discipline}
                        type="button"
                        onClick={() => toggleDiscipline(discipline)}
                        className={`px-3.5 py-2 rounded-full text-[13.5px] font-medium transition-all cursor-pointer border ${isSelected
                          ? 'bg-[#1C4ED1] text-white border-[#1C4ED1] shadow-2xs'
                          : 'bg-[#F8FAFC] text-[#4B5563] border-[#E3E8F4] hover:bg-[#F1F5F9] hover:text-[#040B37]'
                          }`}
                      >
                        {discipline}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Field 4: Which tools do you have experience in? */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2.5">
                <label className="text-base font-semibold text-[#040B37]">
                  Which tools do you have experience in? <span className="text-[#1C4ED1]">*</span>
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {TOOL_OPTIONS.map((tool) => {
                    const isSelected = selectedTools.includes(tool);
                    return (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => toggleTool(tool)}
                        className={`px-3.5 py-2 rounded-full text-[13.5px] font-medium transition-all cursor-pointer border ${isSelected
                          ? 'bg-[#1C4ED1] text-white border-[#1C4ED1] shadow-2xs'
                          : 'bg-[#F8FAFC] text-[#4B5563] border-[#E3E8F4] hover:bg-[#F1F5F9] hover:text-[#040B37]'
                          }`}
                      >
                        {tool}
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Step 3 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep3Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep3Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 4: "Almost there! How would you like to be intro’d?" */}
          {currentStep === 4 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 4 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Almost there! How would you like to be intro’d?
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280]">
                  Introduce yourself to mentees and students and let them know your field experience.
                </p>
              </motion.div>

              {/* Bio Textarea with Groq AI Enhancement Button */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label className="text-base font-semibold text-[#040B37] flex items-center gap-2">
                  Everyone has a story, what’s yours? <span className="text-[#1C4ED1]">*</span>
                </label>

                <div className="relative flex flex-col rounded-[18px] border border-[#E3E8F4] bg-[#F8FAFC] overflow-hidden focus-within:border-[#1C4ED1] transition-all">
                  <Textarea
                    placeholder="Introduce yourself to mentees and let them know your experience in your field and how you can help!"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={5}
                    className="w-full p-4 pb-14 text-base bg-transparent border-0 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#9CA3AF] placeholder:font-normal"
                  />

                  {/* Groq AI Bio Enhancement Button */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleEnhanceBio}
                      disabled={isEnhancing}
                      className="px-4 py-2 rounded-full bg-white border border-[#E3E8F4] text-[#1C4ED1] text-[13px] font-bold shadow-xs hover:bg-[#F4F6FB] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isEnhancing ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-[#1C4ED1]" />
                          <span>Enhancing Bio...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[14px]">✨</span>
                          <span>Enhance Bio</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {enhanceError && (
                  <p className="text-[12px] text-red-600 font-medium pt-1">{enhanceError}</p>
                )}
              </motion.div>

              {/* Executive LinkedIn Sample Bio Inspiration Card (Scrollable with custom scrollbar) */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2 pt-1">
                <label className="text-base font-semibold text-[#040B37]">
                  Sample Bio Inspiration
                </label>
                <div className="max-h-[140px] overflow-y-auto custom-scrollbar p-4 rounded-[16px] bg-[#F1F5F9]/80 border border-[#E2E8F0] text-base text-[#475569] leading-relaxed flex flex-col gap-2">
                  <p>
                    Senior Staff Product Designer at Stripe with 8+ years of experience building design systems and scalable fintech applications. Passionate about empowering the next generation of tech creators through hands-on mentorship.
                  </p>
                  <p className="font-semibold text-[#040B37] pt-1">I can assist you with:</p>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-[#475569]">
                    <li>Portfolio & Resume Reviews tailored for top tech companies</li>
                    <li>Design Systems & Component Library Architecture</li>
                    <li>Career Transitions, Stakeholder Management & Interview Prep</li>
                  </ul>
                </div>
              </motion.div>

              {/* Step 4 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep4Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep4Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 5: "Share your knowledge" (Udemy Model) */}
          {currentStep === 5 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 5 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Share your knowledge
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280] leading-relaxed">
                  CSCN courses are video and project-based experiences that give students the chance to learn actionable skills. Whether you have experience teaching, or it&apos;s your first time, we&apos;ll help you package your knowledge into an online course that improves student lives.
                </p>
              </motion.div>

              {/* Teaching Experience Question */}
              <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-2">
                <label className="text-xl font-semibold text-[#040B37]">
                  What kind of teaching have you done before? <span className="text-[#1C4ED1]">*</span>
                </label>

                <div className="flex flex-col gap-3">
                  {[
                    { id: 'informal', label: 'In person, informally' },
                    { id: 'professional', label: 'In person, professionally' },
                    { id: 'online', label: 'Online' },
                    { id: 'other', label: 'Other' },
                  ].map((opt) => {
                    const isSelected = teachingExperience === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTeachingExperience(opt.id)}
                        className={`flex items-center gap-3.5 p-4 rounded-[14px] border text-left cursor-pointer transition-all ${isSelected
                          ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-2xs'
                          : 'border-[#E3E8F4] bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                          }`}
                      >
                        <div className="flex items-center justify-center shrink-0">
                          {isSelected ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#040B37" strokeWidth="1.75" fill="white" />
                              <circle cx="10" cy="10" r="4.5" fill="#1C4ED1" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#2D2F31" strokeWidth="1.5" fill="white" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[15px] font-medium text-[#040B37]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Step 5 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep5Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep5Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 6: "Create a course" (Udemy Model) */}
          {currentStep === 6 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 6 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Create a course
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280] leading-relaxed">
                  Over the years we&apos;ve helped thousands of instructors learn how to record at home. No matter your experience level, you can become a video pro too. We&apos;ll equip you with the latest resources, tips, and support to help you succeed.
                </p>
              </motion.div>

              {/* Video Readiness Question */}
              <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-2">
                <label className="text-xl font-semibold text-[#040B37]">
                  How much of a video &quot;pro&quot; are you? <span className="text-[#1C4ED1]">*</span>
                </label>

                <div className="flex flex-col gap-3">
                  {[
                    { id: 'beginner', label: 'I’m a beginner' },
                    { id: 'some_knowledge', label: 'I have some knowledge' },
                    { id: 'experienced', label: 'I’m experienced' },
                    { id: 'videos_ready', label: 'I have videos ready to upload' },
                  ].map((opt) => {
                    const isSelected = videoReadiness === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setVideoReadiness(opt.id)}
                        className={`flex items-center gap-3.5 p-4 rounded-[14px] border text-left cursor-pointer transition-all ${isSelected
                          ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-2xs'
                          : 'border-[#E3E8F4] bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                          }`}
                      >
                        <div className="flex items-center justify-center shrink-0">
                          {isSelected ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#040B37" strokeWidth="1.75" fill="white" />
                              <circle cx="10" cy="10" r="4.5" fill="#1C4ED1" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#2D2F31" strokeWidth="1.5" fill="white" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[15px] font-medium text-[#040B37]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Step 6 Footer Controls */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep6Valid || isNavigating}
                  onClick={handleNextStep}
                  rightIcon={<ArrowRight size={15} />}
                  className={`text-[14px] font-medium transition-all ${!isStep6Valid || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  Continue
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* STEP 7: "Expand your reach" (Udemy Model) */}
          {currentStep === 7 && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-6"
            >
              {/* Step 7 Header */}
              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <h1 className="text-[22px] sm:text-[26px] font-medium text-[#040B37] tracking-[-0.02em] leading-snug">
                  Expand your reach
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#6B7280] leading-relaxed">
                  Once you publish your course, you can grow your student audience and make an impact with the support of CSCN marketplace promotions and also through your own marketing efforts. Together, we&apos;ll help the right students discover your course.
                </p>
              </motion.div>

              {/* Audience Size Question */}
              <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-2">
                <label className="text-xl font-semibold text-[#040B37]">
                  Do you have an audience to share your course with? <span className="text-[#1C4ED1]">*</span>
                </label>

                <div className="flex flex-col gap-3">
                  {[
                    { id: 'none', label: 'Not at the moment' },
                    { id: 'small', label: 'I have a small following' },
                    { id: 'sizeable', label: 'I have a sizeable following' },
                  ].map((opt) => {
                    const isSelected = audienceSize === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setAudienceSize(opt.id)}
                        className={`flex items-center gap-3.5 p-4 rounded-[14px] border text-left cursor-pointer transition-all ${isSelected
                          ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 shadow-2xs'
                          : 'border-[#E3E8F4] bg-[#F8FAFC] hover:bg-[#F1F5F9] hover:border-[#CBD5E1]'
                          }`}
                      >
                        <div className="flex items-center justify-center shrink-0">
                          {isSelected ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#040B37" strokeWidth="1.75" fill="white" />
                              <circle cx="10" cy="10" r="4.5" fill="#1C4ED1" />
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="10" cy="10" r="8.75" stroke="#2D2F31" strokeWidth="1.5" fill="white" />
                            </svg>
                          )}
                        </div>
                        <span className="text-[15px] font-medium text-[#040B37]">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Step 7 Footer Controls (Submit & Finish without bold arrow icon) */}
              <motion.div variants={itemVariants} className="mt-4 flex items-center justify-between pt-5 border-t border-[#E3E8F4]">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-[#6B7280] hover:text-[#040B37] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>

                <Button
                  variant="gradient"
                  size="md"
                  hasBorder={true}
                  rounded="full"
                  disabled={!isStep7Valid || isSubmittingFinal || isNavigating}
                  onClick={handleFinalSubmit}
                  rightIcon={isSubmittingFinal ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                  className={`text-[14px] font-bold transition-all ${!isStep7Valid || isSubmittingFinal || isNavigating
                    ? 'opacity-40 cursor-not-allowed pointer-events-none'
                    : 'bg-[#1C4ED1] text-white'
                    }`}
                >
                  {isSubmittingFinal ? 'Completing...' : 'Submit & Finish'}
                </Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto py-4 text-center text-[12px] text-[#9CA3AF]" />
    </div>
  );
}
