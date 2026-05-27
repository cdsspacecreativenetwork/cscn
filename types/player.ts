export interface PlayerResource {
  id: string;
  title: string;
  url: string;
  type: string;
}

export interface PlayerTimestamp {
  time: string;
  label: string;
}

export interface PlayerNote {
  id: string;
  body: string;
  timestamp: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerQuizOption {
  id: string;
  text: string;
  position: number;
}

export interface PlayerQuizQuestion {
  id: string;
  type: string;
  prompt: string;
  position: number;
  options: PlayerQuizOption[];
}

export interface PlayerQuiz {
  id: string;
  mode: string;
  instructions: string | null;
  passingScore: number | null;
  maxAttempts: number | null;
  showAnswers: boolean;
  gateUntilPassed: boolean;
  shuffleQuestions: boolean;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  questions: PlayerQuizQuestion[];
}

export interface SidebarLesson {
  id: string;
  title: string;
  duration: string;
  contentType: string;
  isPreview: boolean;
  isLocked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface SidebarModule {
  id: string;
  title: string;
  position: number;
  lessons: SidebarLesson[];
}

export interface PlayerLesson {
  id: string;
  title: string;
  overview: string | null;
  videoUrl: string | null;
  muxPlaybackId: string | null;
  muxToken: string | null;
  timestamps: PlayerTimestamp[];
  duration: number | null;
  transcript: string | null;
  bodyContent: string | null;
  contentType: string;
  quiz: PlayerQuiz | null;
  progress: {
    lastSeekTime: number;
    percentComplete: number;
    isCompleted: boolean;
  } | null;
  resources: PlayerResource[];
  notes: PlayerNote[];
}
