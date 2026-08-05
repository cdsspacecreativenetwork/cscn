"use client";

import React, { useState, useTransition } from "react";
import { X, FolderOpen, Loader2, Download, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { claimFreeResourceAction, redirectToResourceCheckoutAction } from "@/actions/marketplace-resources";

type PublicResource = {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  thumbnailUrl: string | null;
  isFree: boolean;
  price: any;
  currency: string;
  owner: { name: string | null; image: string | null };
  course: { title: string; slug: string } | null;
};

export default function PublicResourcesClient({ resources }: { resources: PublicResource[] }) {
  const [selectedResource, setSelectedResource] = useState<PublicResource | null>(null);
  const [pending, startTransition] = useTransition();

  const handleClaimOrCheckout = (resource: PublicResource) => {
    startTransition(async () => {
      try {
        if (resource.isFree) {
          const result = await claimFreeResourceAction(resource.slug);
          if (result?.error) {
            toast.error(result.error);
          }
        } else {
          const result = await redirectToResourceCheckoutAction(resource.slug);
          if (result?.error) {
            toast.error(result.error);
          }
        }
      } catch (err: any) {
        console.error("Action failed:", err);
        toast.error("Failed to complete request. Please sign in or try again.");
      }
    });
  };

  return (
    <>
      {/* Resources Grid - exact Figma card layout */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <article
            key={resource.id}
            onClick={() => setSelectedResource(resource)}
            className="group cursor-pointer rounded-[20px] border border-[#E3E8F4] bg-white p-5 transition-all hover:border-[#1C4ED1]/30 hover:shadow-md flex flex-col justify-between"
          >
            <div>
              {/* Thumbnail Container */}
              <div className="relative aspect-[16/10] w-full rounded-[14px] overflow-hidden bg-[#F4F6FB] mb-5">
                {resource.thumbnailUrl ? (
                  <img
                    src={resource.thumbnailUrl}
                    alt={resource.title}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]">
                    <FolderOpen size={36} />
                  </div>
                )}
              </div>

              {/* Status Label (Figma-styled) */}
              <span className="text-[12px] font-bold tracking-wider uppercase text-[#9CA3AF]">
                {resource.isFree ? "Free" : `Paid`}
              </span>

              {/* Resource Title */}
              <h2 className="mt-1 text-[20px] font-bold text-[#040B37] leading-snug group-hover:text-[#1C4ED1] transition-colors line-clamp-2">
                {resource.title}
              </h2>
            </div>

            {/* Bottom Action Button (Figma-styled) */}
            <div className="mt-6">
              <button
                type="button"
                className="w-full rounded-full border border-[#E3E8F4] py-3.5 px-6 font-bold text-[#040B37] text-[14px] bg-white hover:bg-[#F4F6FB] hover:border-[#040B37]/35 transition-all flex items-center justify-center gap-2 group-hover:bg-[#1C4ED1] group-hover:text-white group-hover:border-[#1C4ED1]"
              >
                {resource.isFree ? "Download" : `Pay $${Number(resource.price).toLocaleString()}`}
              </button>
            </div>
          </article>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stroke p-16 text-center">
          <div className="w-16 h-16 rounded-[12px] flex items-center justify-center border border-[#1C4ED1]/15 mb-4">
            <FolderOpen size={30} className="text-[#1C4ED1]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#040B37]">No resources published yet</h3>
          <p className="text-[14px] text-[#9CA3AF] mt-1">Please check back later.</p>
        </div>
      )}

      {/* Resource Details Modal */}
      {selectedResource && (
        <div className="fixed inset-0 z-[150] flex items-end justify-center bg-[#040B37]/50 p-0 backdrop-blur-sm sm:items-center sm:p-6 animate-fadeIn">
          <button
            className="absolute inset-0 cursor-default bg-transparent"
            onClick={() => setSelectedResource(null)}
            aria-label="Close modal"
          />
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[24px] border border-white/60 bg-white shadow-2xl sm:rounded-[24px] font-jakarta">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-[#E3E8F4] px-6 py-5 sm:px-8">
              <div>
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#1C4ED1]">
                  {selectedResource.category.replaceAll("_", " ")}
                </span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#040B37]">
                  Resource Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedResource(null)}
                className="p-2 rounded-full text-[#9CA3AF] hover:text-[#040B37] hover:bg-[#F4F6FB] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </header>

            {/* Body */}
            <div className="overflow-y-auto p-6 sm:p-8 space-y-6">
              {/* Image Preview */}
              {selectedResource.thumbnailUrl && (
                <div className="w-full aspect-[16/9] rounded-[14px] overflow-hidden bg-[#F4F6FB] border border-[#E3E8F4]">
                  <img
                    src={selectedResource.thumbnailUrl}
                    alt={selectedResource.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Author */}
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#040B37] leading-tight">
                  {selectedResource.title}
                </h3>
                <p className="text-sm font-medium text-[#9CA3AF]">
                  Published by <span className="text-[#040B37] font-semibold">{selectedResource.owner.name ?? "CSCN Instructor"}</span>
                  {selectedResource.course && (
                    <>
                      {" "}
                      · Linked to{" "}
                      <span className="text-[#1C4ED1] font-semibold">{selectedResource.course.title}</span>
                    </>
                  )}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-black uppercase tracking-wider text-[#9CA3AF]">
                  Description
                </h4>
                <p className="text-[14px] text-[#4B5563] leading-relaxed whitespace-pre-line">
                  {selectedResource.description || "No description provided."}
                </p>
              </div>

              {/* Pricing Box */}
              <div className="rounded-[12px] bg-[#F8FAFC] border border-[#E3E8F4] p-5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#9CA3AF]">
                    Resource Price
                  </h4>
                  <p className="text-2xl font-black text-[#040B37] mt-1">
                    {selectedResource.isFree ? "Free" : `$${Number(selectedResource.price).toLocaleString()}`}
                  </p>
                </div>
                <div className="text-xs font-bold text-[#9CA3AF] bg-white border border-[#E3E8F4] px-3 py-1.5 rounded-[8px] uppercase tracking-wider">
                  {selectedResource.isFree ? "Immediate Download" : "Paystack Checkout"}
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-[#E3E8F4] bg-[#F8FAFC] px-6 py-5 sm:px-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="px-5 py-3 rounded-full text-sm font-bold text-[#4B5563] hover:bg-[#E3E8F4]/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleClaimOrCheckout(selectedResource)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-[#1C4ED1] hover:bg-[#153eb2] text-white text-sm font-bold transition-all shadow-md disabled:opacity-50"
              >
                {pending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : selectedResource.isFree ? (
                  <>
                    <Download size={16} />
                    Download File
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    Buy Now
                  </>
                )}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}
