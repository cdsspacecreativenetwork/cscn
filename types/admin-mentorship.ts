export type AdminMentorshipConsoleData = {
  stats: Array<{
    label: string;
    value: number | string;
  }>;
  bookingMix: {
    total: number;
    paid: number;
    free: number;
    pending: number;
    cancelled: number;
  };
  issues: Array<{
    label: string;
    value: number;
    tone: string;
    description: string;
  }>;
  applications: Array<{
    id: string;
    status: string;
    pitch: string;
    audience: string | null;
    topics: string[];
    sessionTypes: string[];
    mentorshipFree: boolean;
    proposedPrice: string | null;
    proposedCurrency: string;
    instructions: string | null;
    reviewNote: string | null;
    submittedAt: string;
    instructor: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
      headline: string | null;
      instructorVerificationStatus: string;
      publicProfileSlug: string | null;
      payoutSetup: boolean;
      activeAvailability: number;
      _count: {
        taughtCourses: number;
        mentorBookings: number;
      };
    };
  }>;
  requests: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    headline: string | null;
    mentorshipBio: string | null;
    mentorshipTopics: string[];
    payoutSetup: boolean;
    readiness: {
      hasTopics: boolean;
      hasAvailability: boolean;
      hasPayout: boolean;
      hasBio: boolean;
    };
    mentorAvailabilities: Array<{ id: string }>;
    _count: {
      taughtCourses: number;
      mentorBookings: number;
    };
  }>;
  activeMentors: Array<{
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    headline: string | null;
    mentorshipEligible: boolean;
    mentorshipEnabled: boolean;
    mentorshipFree: boolean;
    mentorshipPrice: string | null;
    mentorshipCurrency: string;
    mentorshipTopics: string[];
    payoutSetup: boolean;
    activeAvailability: number;
    bookings: number;
    confirmed: number;
    completed: number;
    paid: number;
  }>;
  recentBookings: Array<{
    id: string;
    status: string;
    topic: string | null;
    startsAt: string;
    endsAt: string;
    timezone: string;
    price: string | null;
    currency: string;
    mentor: {
      id: string;
      name: string | null;
      email: string;
    };
    student: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  }>;
};
