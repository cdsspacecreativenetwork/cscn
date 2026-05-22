export interface PlayerResource {
  id: string;
  title: string;
  url: string;
  type: string;
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
  videoUrl: string | null;
  muxPlaybackId: string | null;
  muxToken: string | null;
  duration: number | null;
  transcript: string | null;
  bodyContent: string | null;
  contentType: string;
  progress: {
    lastSeekTime: number;
    percentComplete: number;
    isCompleted: boolean;
  } | null;
  resources: PlayerResource[];
}
