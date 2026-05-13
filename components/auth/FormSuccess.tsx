import { CheckCircle2 } from "lucide-react";

interface FormSuccessProps {
  message?: string;
};

export const FormSuccess = ({
  message,
}: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className="bg-[#1CB247]/10 p-4 rounded-[12px] flex items-center gap-x-3 text-[14px] font-medium text-[#1CB247] animate-in fade-in slide-in-from-top-2 duration-300">
      <CheckCircle2 className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
};
