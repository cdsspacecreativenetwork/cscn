'use client';

interface TranscriptSidebarProps {
  transcript: string | null;
}

export const TranscriptSidebar = ({ transcript }: TranscriptSidebarProps) => {
  return (
    <div className="bg-white border border-stroke w-full h-[472px] max-h-[472px] rounded-xl flex flex-col overflow-hidden shadow-sm font-jakarta">
      <div className="h-16 border-b border-stroke flex items-center px-6 shrink-0">
        <h2 className="font-semibold text-navy text-base">Transcript</h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        {transcript ? (
          <p className="font-medium text-text-body text-sm leading-relaxed whitespace-pre-line">
            {transcript}
          </p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-stroke-ii">
              <path d="M9 12h6M9 16h4M7 8h10M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p className="text-text-mute text-sm font-medium">No transcript available for this lesson.</p>
          </div>
        )}
      </div>
    </div>
  );
};
