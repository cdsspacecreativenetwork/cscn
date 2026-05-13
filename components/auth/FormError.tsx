import { AlertTriangle } from "lucide-react";

interface FormErrorProps {
  message?: string;
};

export const FormError = ({
  message,
}: FormErrorProps) => {
  if (!message) return null;

  return (
    <div className="bg-[#FF383C]/10 p-4 rounded-[12px] flex items-center gap-x-3 text-[14px] font-medium text-[#FF383C] animate-in fade-in slide-in-from-top-2 duration-300">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
};
