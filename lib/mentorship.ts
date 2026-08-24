export interface Mentor {
  id: string;
  name: string;
  role: string;
  image: string;
  slug?: string;
  courses: number;
  students: string;
  priceLabel?: string;
  intro?: string | null;
  instructions?: string | null;
  topics?: string[];
  availability?: import("@/lib/mentor-booking-slots").MentorAvailabilityInput[];
  slots?: import("@/lib/mentor-booking-slots").MentorBookingSlot[];
  focusAreas?: string[];
  bookingContext?: {
    cohortId: string;
    cohortTitle: string;
    returnTo: string;
    submissions: Array<{ id: string; title: string; projectTitle: string; status: string }>;
  };
}

export const MENTORSHIP_BENEFITS = [
  'Portfolio reviews',
  'Career guidance',
  'Project feedback',
  'Skill improvement',
  'Industry insights'
];
