'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Compass,
  Crown,
  Layers3,
  Lightbulb,
  MonitorPlay,
  Palette,
  Rocket,
  ScrollText,
  Sprout,
  Target,
  TrendingUp,
  UserRoundCheck,
  Video,
} from 'lucide-react';
import { SiReact, SiWebflow } from 'react-icons/si';
import { toast } from 'sonner';

import { upsertLearnerInterestProfileAction } from '@/actions/learner-interest';
import Button from '@/components/ui/Button';
import {
  INTEREST_AREA_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SKILL_LEVEL_OPTIONS,
} from '@/lib/learner-interest-options';

type InterestArea = (typeof INTEREST_AREA_OPTIONS)[number];
type LearningStyle = (typeof LEARNING_STYLE_OPTIONS)[number];
type SkillLevel = (typeof SKILL_LEVEL_OPTIONS)[number];
type PrimaryGoal = (typeof PRIMARY_GOAL_OPTIONS)[number];

type InitialProfile = {
  interestAreas: InterestArea[];
  skillLevel: SkillLevel;
  primaryGoal: PrimaryGoal;
  learningStyle: LearningStyle[];
  note: string;
  completed: boolean;
};

type LaunchOnboardingFlowProps = {
  userName?: string | null;
  rolloutDate: string;
  isPioneer: boolean;
  launchMode: boolean;
  initialProfile: InitialProfile;
};

const steps = ['Welcome', 'Interests', 'Level', 'Goal', 'Style', 'Priorities', 'Done'] as const;

const iconClass = 'h-[18px] w-[18px]';

const interestIcons: Record<InterestArea, React.ReactNode> = {
  'UI/UX Design': <AssetIcon src="/assets/figma.svg" alt="Figma" />,
  'Frontend Development': <SiReact className="h-5 w-5 text-[#149ECA]" />,
  'Product Design': <Layers3 className={iconClass} />,
  'AI Tools': <AssetIcon src="/assets/ai-magic.svg" alt="AI tools" />,
  Branding: <AssetIcon src="/assets/adobe-illustrator.svg" alt="Illustrator" />,
  'Motion Design': <AssetIcon src="/assets/adobe-after-effect.svg" alt="After Effects" />,
  'No-code / Webflow': <SiWebflow className="h-5 w-5 text-[#146EF5]" />,
  'Not sure yet': <Compass className={iconClass} />,
};

const skillIcons: Record<SkillLevel, React.ReactNode> = {
  Beginner: <Sprout className={iconClass} />,
  Intermediate: <TrendingUp className={iconClass} />,
  Advanced: <Award className={iconClass} />,
};

const goalIcons: Record<PrimaryGoal, React.ReactNode> = {
  'Get a job': <BriefcaseBusiness className={iconClass} />,
  'Improve current skills': <TrendingUp className={iconClass} />,
  'Build portfolio': <Palette className={iconClass} />,
  Freelance: <Rocket className={iconClass} />,
  'Start a business': <Crown className={iconClass} />,
  'Learn for personal growth': <Lightbulb className={iconClass} />,
};

const learningStyleIcons: Record<LearningStyle, React.ReactNode> = {
  'Short videos': <Video className={iconClass} />,
  'Live classes': <MonitorPlay className={iconClass} />,
  Projects: <Target className={iconClass} />,
  Mentorship: <UserRoundCheck className={iconClass} />,
  'Reading/resources': <ScrollText className={iconClass} />,
};

function AssetIcon({ src, alt }: { src: string; alt: string }) {
  return <Image src={src} alt={alt} width={22} height={22} className="h-[22px] w-[22px] object-contain" unoptimized />;
}

function formatRolloutDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

function OptionCard({
  label,
  selected,
  onClick,
  icon,
  description,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[72px] w-full items-center justify-between gap-4 rounded-[12px] border px-4 py-3 text-left transition ${
        selected
          ? 'border-[#1C4ED1] bg-[#EEF3FF] text-[#040B37] shadow-[0_12px_28px_rgba(28,78,209,0.08)]'
          : 'border-[#E3E8F4] bg-white text-[#4B5563] hover:border-[#BFD0FF] hover:bg-[#F8FAFF]'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border ${selected ? 'border-[#DDE7FF] bg-white text-[#1C4ED1]' : 'border-transparent bg-[#F4F6FB] text-[#6B7280]'}`}>
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-bold leading-[1.25]">{label}</span>
          {description ? <span className="mt-1 block text-[12px] font-semibold leading-[1.35] text-[#6B7280]">{description}</span> : null}
        </span>
      </span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${selected ? 'border-[#1C4ED1] bg-[#1C4ED1] text-white' : 'border-[#D7DEEC] bg-white text-transparent'}`}>
        <Check size={14} strokeWidth={3} />
      </span>
    </button>
  );
}

function ChoiceGrid<T extends string>({
  options,
  selected,
  toggle,
  icons,
}: {
  options: readonly T[];
  selected: readonly T[];
  toggle: (value: T) => void;
  icons: Record<T, React.ReactNode>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <OptionCard
          key={option}
          label={option}
          selected={selected.includes(option)}
          onClick={() => toggle(option)}
          icon={icons[option]}
        />
      ))}
    </div>
  );
}

function StepHeader({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="mx-auto text-center sm:text-left">
      {/* <p className="text-[12px] font-black uppercase tracking-[0.16em] text-[#1C4ED1]">{eyebrow}</p> */}
      <h1 className="mt-3 text-[32px] font-black leading-[1.08] tracking-normal text-[#040B37] sm:text-[44px]">
        {title}
      </h1>
      <p className="mt-4 text-[15px] font-medium leading-[1.65] text-[#5E6878] sm:text-[17px]">
        {body}
      </p>
    </div>
  );
}

export default function LaunchOnboardingFlow({
  userName,
  rolloutDate,
  isPioneer,
  launchMode,
  initialProfile,
}: LaunchOnboardingFlowProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(initialProfile.completed ? 1 : 0);
  const [interestAreas, setInterestAreas] = React.useState<InterestArea[]>(initialProfile.interestAreas);
  const [skillLevel, setSkillLevel] = React.useState<SkillLevel>(initialProfile.skillLevel);
  const [primaryGoal, setPrimaryGoal] = React.useState<PrimaryGoal>(initialProfile.primaryGoal);
  const [learningStyle, setLearningStyle] = React.useState<LearningStyle[]>(initialProfile.learningStyle);
  const [note, setNote] = React.useState(initialProfile.note);
  const [isComplete, setIsComplete] = React.useState(initialProfile.completed);
  const [isPending, startTransition] = React.useTransition();

  const firstName = userName?.split(' ')[0] || 'there';
  const formattedRolloutDate = formatRolloutDate(rolloutDate);
  const isLastInputStep = step === 5;
  const isDoneStep = step === 6;

  const toggleInterest = (value: InterestArea) => {
    setInterestAreas((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const toggleLearningStyle = (value: LearningStyle) => {
    setLearningStyle((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const canContinue =
    step === 0 ||
    (step === 1 && interestAreas.length > 0) ||
    step === 2 ||
    step === 3 ||
    (step === 4 && learningStyle.length > 0) ||
    step === 5 ||
    step === 6;

  const goNext = () => {
    if (!canContinue) return;
    if (isLastInputStep) {
      startTransition(async () => {
        const result = await upsertLearnerInterestProfileAction({
          interestAreas,
          skillLevel,
          primaryGoal,
          learningStyle,
          note,
        });

        if (result.error) {
          toast.error(result.error);
          return;
        }

        setIsComplete(true);
        setStep(6);
        toast.success('Learning profile saved.');
      });
      return;
    }

    if (isDoneStep) {
      router.push('/dashboard/profile');
      router.refresh();
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const goBack = () => {
    if (step === 0) {
      router.push('/');
      return;
    }
    setStep((current) => Math.max(current - 1, 0));
  };

  return (
    <main className="min-h-screen bg-[#F4F6FB] px-5 py-6 font-jakarta text-[#040B37] sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-48px)] w-full max-w-[1060px] flex-col">
        <section className="flex flex-1 items-center py-8 sm:py-12">
          <div className="mx-auto w-full max-w-[820px]">
            {step === 0 && (
              <div className="text-center">
                <div className="mx-auto mb-7 flex items-center justify-center">
                  <Image src="/assets/dashboard/signup/square-logo.svg" alt="CSCN" width={42} height={42} className="h-[42px] w-[42px]" unoptimized />
                </div>
                <h1 className="mx-auto max-w-[720px] text-[24px] font-black leading-[1.08] tracking-normal text-black sm:text-[38px]">
                  Set up your CSCN learning path.
                </h1>
                <p className="mx-auto mt-5 max-w-[600px] text-[15px] font-medium leading-[1.65] text-[#5E6878] sm:text-[17px]">
                  Hi {firstName}. Tell us what you want to learn so the first course tracks, mentorship, and project experiences reflect real learner demand.
                </p>
                {/* <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE7FF] bg-white px-4 py-2 text-[13px] font-bold text-[#040B37]">
                    <BadgeCheck size={16} className="text-[#1C4ED1]" />
                    {isPioneer ? 'Pioneer Member' : launchMode ? 'Early access learner' : 'Learning profile'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#DDE7FF] bg-white px-4 py-2 text-[13px] font-bold text-[#040B37]">
                    <BookOpen size={16} className="text-[#1C4ED1]" />
                    Courses from {formattedRolloutDate}
                  </span>
                </div> */}
              </div>
            )}

            {step === 1 && (
              <div>
                <StepHeader
                  eyebrow="Interest areas"
                  title="What do you want to learn first?"
                  body="Choose one or more areas. These answers help CSCN prioritize the first course tracks with real demand behind them."
                />
                <div className="mt-8">
                  <ChoiceGrid options={INTEREST_AREA_OPTIONS} selected={interestAreas} toggle={toggleInterest} icons={interestIcons} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <StepHeader
                  eyebrow="Skill level"
                  title="Where are you starting from?"
                  body="Pick the level that best describes your current confidence so lessons can meet you at the right depth."
                />
                <div className="mt-8 grid gap-3">
                  {SKILL_LEVEL_OPTIONS.map((option) => (
                    <OptionCard
                      key={option}
                      label={option}
                      selected={skillLevel === option}
                      onClick={() => setSkillLevel(option)}
                      icon={skillIcons[option]}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <StepHeader
                  eyebrow="Primary goal"
                  title="What outcome matters most?"
                  body="This helps CSCN shape course projects, support, and mentorship around what students are actually trying to achieve."
                />
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {PRIMARY_GOAL_OPTIONS.map((option) => (
                    <OptionCard
                      key={option}
                      label={option}
                      selected={primaryGoal === option}
                      onClick={() => setPrimaryGoal(option)}
                      icon={goalIcons[option]}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <StepHeader
                  eyebrow="Learning style"
                  title="How do you learn best?"
                  body="Choose every format that would make CSCN more useful, practical, and motivating for you."
                />
                <div className="mt-8">
                  <ChoiceGrid options={LEARNING_STYLE_OPTIONS} selected={learningStyle} toggle={toggleLearningStyle} icons={learningStyleIcons} />
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <StepHeader
                  eyebrow="Priorities"
                  title="What should CSCN prioritize first?"
                  body="Add anything the options did not capture. This is optional, but it gives the team useful launch direction."
                />
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  maxLength={800}
                  rows={6}
                  placeholder="For example: practical portfolio projects, weekly live reviews, or a beginner-friendly AI tools track."
                  className="mt-8 w-full resize-none rounded-[16px] border border-[#DDE7FF] bg-white px-5 py-4 text-[15px] font-semibold leading-[1.65] text-[#040B37] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#1C4ED1] focus:ring-4 focus:ring-[#1C4ED1]/10"
                />
                <p className="mt-2 text-right text-[12px] font-bold text-[#9CA3AF]">{note.length}/800</p>
              </div>
            )}

            {step === 6 && (
              <div className="text-center">
                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-[18px] bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={34} />
                </div>
                <h1 className="mx-auto max-w-[680px] text-[34px] font-black leading-[1.08] tracking-normal text-[#040B37] sm:text-[48px]">
                  You&apos;re in.
                </h1>
                <p className="mx-auto mt-5 max-w-[600px] text-[15px] font-medium leading-[1.65] text-[#5E6878] sm:text-[17px]">
                  {isComplete
                    ? 'Your learning profile has been saved. Next, complete your dashboard profile so CSCN can personalize your account properly.'
                    : 'Your learning profile is ready.'}
                </p>
              </div>
            )}
          </div>
        </section>

        <footer className="flex flex-col gap-5 border-t border-[#DDE7FF] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-[14px] font-bold text-[#4B5563] transition hover:bg-white hover:text-[#040B37]"
          >
            <ArrowLeft size={17} />
            Back
          </button>

          <div className="flex items-center justify-center gap-2">
            {steps.map((item, index) => (
              <span
                key={item}
                className={`h-2 rounded-full transition-all ${index === step ? 'w-9 bg-[#040B37]' : index < step ? 'w-2 bg-[#1C4ED1]' : 'w-2 bg-[#D7DEEC]'}`}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="gradient"
            size="default"
            rounded="full"
            loading={isPending}
            disabled={!canContinue || isPending}
            onClick={goNext}
            rightIcon={!isPending ? <ArrowRight size={18} /> : undefined}
            className="w-full sm:w-auto"
          >
            {isDoneStep ? 'Complete Profile' : isLastInputStep ? 'Save Profile' : 'Continue'}
          </Button>
        </footer>
      </div>
    </main>
  );
}
