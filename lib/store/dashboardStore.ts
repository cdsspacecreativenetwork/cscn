import { create } from 'zustand';

interface DashboardState {
  activeModal: 'resume' | 'start' | null;
  selectedCourse: any | null;
  setActiveModal: (modal: 'resume' | 'start' | null) => void;
  setSelectedCourse: (course: any | null) => void;
  openResumeModal: (course: any) => void;
  openStartModal: (course: any) => void;
  closeModals: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  activeModal: null,
  selectedCourse: null,
  setActiveModal: (modal) => set({ activeModal: modal }),
  setSelectedCourse: (course) => set({ selectedCourse: course }),
  openResumeModal: (course) => set({ 
    selectedCourse: {
      ...course,
      lessonInfo: course.lessonInfo || "Lesson 2 of 7",
      image: course.image || course.thumbnail || "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg",
      description: course.description || "This is the course player view for the current lesson. You can watch the video, read the transcript, and take notes here."
    },
    activeModal: 'resume' 
  }),
  openStartModal: (course) => set({ 
    selectedCourse: {
      ...course,
      duration: course.duration || "12h Total",
      image: course.image || course.thumbnail || "/assets/dashboard/4ac765d60f4a6d8d460e05d02a14694fb071397e.jpg",
      description: course.description || "Dive deep into the intricacies of this course. Master the foundational principles, advanced techniques, and practical applications required to excel in this field. Start learning today!"
    },
    activeModal: 'start' 
  }),
  closeModals: () => set({ activeModal: null, selectedCourse: null }),
}));
