'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { User } from '@prisma/client';
import { Camera, X, Check, UploadCloud, Loader2 } from 'lucide-react';
import { settings } from '@/actions/settings';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateTapbackAvatar } from '@/lib/avatar';
import Cropper from 'react-easy-crop';
import getCroppedImg from '@/lib/cropImage';
import { uploadAvatar } from '@/actions/upload';
import { useSession } from 'next-auth/react';

// Generate specific categorized stacks
const generateStack = (type: 'memoji' | 'vector' | 'sketch') => {
  const seeds = ["Felix", "Aneka", "Jasper", "Luna", "Oliver", "Sophia", "Leo", "Mia"];
  return seeds.map((seed, i) => {
    if (type === 'memoji') return `https://www.tapback.co/api/avatar/${seed}.webp?color=${(i % 12) + 1}`;
    if (type === 'vector') return `https://api.dicebear.com/9.x/micah/svg?seed=${seed}&backgroundColor=f4f6fb`;
    return `https://api.dicebear.com/9.x/notionists/svg?seed=${seed}&backgroundColor=f4f6fb`;
  });
};

const STACKS = {
  memoji: generateStack('memoji'),
  vector: generateStack('vector'),
  sketch: generateStack('sketch'),
};

interface ProfileBannerProps {
  user: User;
}

export const ProfileBanner = ({ user }: ProfileBannerProps) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'memoji' | 'vector' | 'sketch' | 'upload'>('memoji');
  
  const fallbackAvatar = generateTapbackAvatar(user.firstName || user.name || user.id);
  const [currentImage, setCurrentImage] = useState(user.image || fallbackAvatar);
  const [isPending, startTransition] = useTransition();
  const { update } = useSession();

  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (file.size > 1 * 1024 * 1024) {
      toast.error("File is too large. Please select an image under 1MB.");
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result?.toString() || null);
    });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleUploadCroppedImage = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Could not crop image");

      const formData = new FormData();
      formData.append("file", croppedBlob, "avatar.png");

      const uploadResult = await uploadAvatar(formData);
      
      if (uploadResult.error) {
        toast.error(uploadResult.error);
        setIsUploading(false);
        return;
      }

      if (uploadResult.url) {
        setCurrentImage(uploadResult.url);
        setIsModalOpen(false);
        setImageToCrop(null);
        
        startTransition(() => {
          settings({ image: uploadResult.url as string })
            .then((data) => {
              if (data.error) {
                toast.error(data.error);
                setCurrentImage(user.image || fallbackAvatar);
              }
              if (data.success) {
                update({ image: uploadResult.url });
                toast.success("Profile picture updated!");
                router.refresh();
              }
            })
            .catch(() => {
              toast.error("Something went wrong!");
              setCurrentImage(user.image || fallbackAvatar);
            });
        });
      }
    } catch (e) {
      toast.error("Failed to process image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectAvatar = (url: string) => {
    setCurrentImage(url);
    setIsModalOpen(false);

    startTransition(() => {
      settings({ image: url })
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            setCurrentImage(user.image || fallbackAvatar);
          }
          if (data.success) {
            update({ image: url });
            toast.success("Profile picture updated!");
            router.refresh();
          }
        })
        .catch(() => {
          toast.error("Something went wrong!");
          setCurrentImage(user.image || fallbackAvatar);
        });
    });
  };

  return (
    <>
      <div className="relative w-full">
        {/* Blue Banner Background - Fixed height 130px as per design */}
        <div className="w-full h-[130px] bg-[#1C4ED1] rounded-t-[24px] overflow-hidden relative">
           <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 to-transparent"></div>
        </div>

        {/* Profile Image Overlap - Exact 164x164 diameter */}
        <div className="absolute top-[40px] left-10 group">
          <div className="relative w-[164px] h-[164px] rounded-full border-[6px] border-white overflow-hidden shadow-sm bg-[#F4F6FB] transition-all">
            <Image 
              src={currentImage}
              alt="Profile" 
              fill 
              className="object-cover"
            />
            <div 
              onClick={() => setIsModalOpen(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]"
            >
              <Camera className="text-white mb-1" size={28} />
              <span className="text-white text-xs font-bold tracking-wider">UPDATE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorized Avatar Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[24px] w-full max-w-[600px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#E3E8F4] shrink-0">
              <h3 className="text-[20px] font-bold text-[#040B37] font-jakarta">Choose Avatar</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F4F6FB] transition-colors text-[#9CA3AF]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 pt-4 shrink-0 flex items-center gap-2 overflow-x-auto hide-scrollbar">
              {['memoji', 'vector', 'sketch', 'upload'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-4 py-2.5 rounded-[12px] text-[14px] font-bold capitalize transition-all whitespace-nowrap ${
                    activeTab === tab 
                      ? 'bg-[#1C4ED1] text-white' 
                      : 'bg-[#F4F6FB] text-[#7F858F] hover:bg-[#E3E8F4]'
                  }`}
                >
                  {tab === 'upload' ? 'Upload Custom' : tab}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto">
              {activeTab === 'upload' ? (
                imageToCrop ? (
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full h-[300px] bg-black/5 rounded-[20px] overflow-hidden">
                      <Cropper
                        image={imageToCrop}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                      />
                    </div>
                    <div className="flex items-center gap-4 px-2">
                      <span className="text-sm font-medium text-[#4B5563]">Zoom</span>
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <button 
                        onClick={() => setImageToCrop(null)}
                        disabled={isUploading}
                        className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#F4F6FB] text-[14px] font-bold text-[#040B37] hover:bg-[#E3E8F4] transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleUploadCroppedImage}
                        disabled={isUploading}
                        className="flex-1 px-4 py-2.5 rounded-[12px] bg-[#1C4ED1] text-[14px] font-bold text-white hover:bg-[#163BB1] transition-colors flex items-center justify-center gap-2"
                      >
                        {isUploading ? <Loader2 className="animate-spin" size={18} /> : "Crop & Upload"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <label 
                    className={`w-full aspect-video border-2 border-dashed rounded-[20px] flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer relative ${
                      isDragging 
                        ? 'border-[#1C4ED1] bg-[#1C4ED1]/5' 
                        : 'border-[#E3E8F4] bg-[#F4F6FB]/50 hover:bg-[#F4F6FB]'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        processFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={handleFileChange} 
                    />
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center pointer-events-none">
                      <UploadCloud className="text-[#1C4ED1]" size={28} />
                    </div>
                    <div className="text-center pointer-events-none">
                      <p className="text-[16px] font-bold text-[#040B37]">Drag and drop your photo</p>
                      <p className="text-[14px] text-[#9CA3AF] font-medium mt-1">PNG, JPG or WEBP</p>
                    </div>
                    <div className="mt-2 px-6 py-2.5 rounded-[12px] bg-white border border-[#E3E8F4] text-[14px] font-bold text-[#040B37] shadow-sm pointer-events-none">
                      Browse Files
                    </div>
                  </label>
                )
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {STACKS[activeTab as keyof typeof STACKS].map((url, i) => (
                    <button
                      key={i}
                      disabled={isPending}
                      onClick={() => handleSelectAvatar(url)}
                      className={`relative aspect-square rounded-full overflow-hidden border-4 transition-all hover:scale-105 active:scale-95 ${currentImage === url ? 'border-[#1C4ED1]' : 'border-transparent hover:border-[#E3E8F4]'} bg-[#F4F6FB]`}
                    >
                      <Image src={url} alt={`Avatar ${i}`} fill className="object-cover" />
                      {currentImage === url && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Check className="text-white" size={24} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

