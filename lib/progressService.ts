export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface ActivityData {
  label: string;
  hours: number;
}

export interface CourseProgress {
  id: string;
  title: string;
  instructor: string;
  category: string;
  progress: number;
  status: 'Completed' | 'In Progress' | 'Just Started';
}

export const getCourseProgress = async (): Promise<CourseProgress[]> => {
  await new Promise(resolve => setTimeout(resolve, 700));
  return [
    {
      id: '1',
      title: 'Figma Masterclass: Advanced Prototyping',
      instructor: 'Sarah Mitchell',
      category: 'Design',
      progress: 50,
      status: 'In Progress'
    },
    {
      id: '2',
      title: 'UI Design Principles',
      instructor: 'Elias Thompson',
      category: 'Design',
      progress: 50,
      status: 'In Progress'
    },
    {
      id: '3',
      title: 'Advanced Guide to Data Visualization',
      instructor: 'Alicia Keys',
      category: 'Data Science',
      progress: 50,
      status: 'In Progress'
    }
  ];
};

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  isUnlocked: boolean;
}

export const getAchievements = async (): Promise<Achievement[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return [
    { id: '1', icon: '🔥', title: '7-Day Streak', isUnlocked: true },
    { id: '2', icon: '💡', title: 'Curious Mind', isUnlocked: true },
    { id: '3', icon: '📚', title: 'Bookworm', isUnlocked: false },
    { id: '4', icon: '🚀', title: '100h Learner', isUnlocked: false },
    { id: '5', icon: '⚡', title: 'Quick Learner', isUnlocked: true },
    { id: '6', icon: '👑', title: 'Top Performer', isUnlocked: false },
    { id: '7', icon: '🎯', title: 'Goal Crusher', isUnlocked: true },
    { id: '8', icon: '🌟', title: '5 Courses Done', isUnlocked: false },
    { id: '9', icon: '🏆', title: 'First Certificate', isUnlocked: true },
    { id: '10', icon: '📝', title: 'Exam Ace', isUnlocked: false }
  ];
};

/**
 * Service to handle learning activity data fetching.
 * Designed to be easily swapped with a real API call.
 */
export const getLearningActivity = async (range: TimeRange): Promise<ActivityData[]> => {
  // Simulating API latency for a premium loading feel
  await new Promise(resolve => setTimeout(resolve, 600));

  // In a real implementation, this would be:
  // const response = await fetch(`/api/user/activity?range=${range}`);
  // return response.json();

  switch (range) {
    case 'daily':
      return [
        { label: '08:00', hours: 0.5 },
        { label: '10:00', hours: 1.2 },
        { label: '12:00', hours: 0.8 },
        { label: '14:00', hours: 2.1 },
        { label: '16:00', hours: 1.5 },
        { label: '18:00', hours: 0.9 },
        { label: '20:00', hours: 0.4 },
      ];
    case 'weekly':
      return [
        { label: 'Mon', hours: 4.5 },
        { label: 'Tue', hours: 6.5 },
        { label: 'Wed', hours: 3.2 },
        { label: 'Thu', hours: 7.0 },
        { label: 'Fri', hours: 6.0 },
        { label: 'Sat', hours: 2.6 },
        { label: 'Sun', hours: 1.5 },
      ];
    case 'monthly':
      return [
        { label: 'Week 1', hours: 28 },
        { label: 'Week 2', hours: 35 },
        { label: 'Week 3', hours: 22 },
        { label: 'Week 4', hours: 40 },
      ];
    case 'yearly':
      return [
        { label: 'Jan', hours: 120 },
        { label: 'Feb', hours: 145 },
        { label: 'Mar', hours: 110 },
        { label: 'Apr', hours: 160 },
        { label: 'May', hours: 140 },
        { label: 'Jun', hours: 90 },
        { label: 'Jul', hours: 130 },
        { label: 'Aug', hours: 155 },
        { label: 'Sep', hours: 170 },
        { label: 'Oct', hours: 140 },
        { label: 'Nov', hours: 125 },
        { label: 'Dec', hours: 150 },
      ];
    default:
      return [];
  }
};

export interface CompletionStats {
  completed: number;
  inProgress: number;
  overallPercentage: number;
}

export const getCompletionStats = async (): Promise<CompletionStats> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    completed: 12,
    inProgress: 5,
    overallPercentage: 85
  };
};
