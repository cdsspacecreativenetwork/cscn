"use client";

import { useState, useTransition } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { deleteInvite } from "@/actions/invite";

interface InviteTableActionsProps {
  id: string;
  token: string;
  isExpiredOrUsed: boolean;
}

export function InviteTableActions({
  id,
  token,
  isExpiredOrUsed,
}: InviteTableActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteInvite(id);
    });
  };

  return (
    <div className="flex items-center gap-2">
      {!isExpiredOrUsed && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[#E3E8F4] bg-[#F4F6FB] text-[12px] font-medium text-[#4B5563] hover:border-[#1C4ED1] hover:text-[#1C4ED1] transition-all"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy link"}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="p-1.5 rounded-[8px] border border-[#E3E8F4] bg-[#F4F6FB] text-[#9CA3AF] hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
        title="Delete invite"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
