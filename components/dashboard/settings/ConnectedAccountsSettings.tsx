'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ChevronLeft,
  ShieldAlert,
  X
} from 'lucide-react';
import { unlinkOAuthAccount } from '@/actions/settings';

interface OAuthAccount {
  provider: string;
  createdAt: string;
}

interface ConnectedAccountsSettingsProps {
  accounts: OAuthAccount[];
  hasPassword: boolean;
  onUpdate: () => Promise<void>;
  onBack: () => void;
}

export const ConnectedAccountsSettings: React.FC<ConnectedAccountsSettingsProps> = ({
  accounts,
  hasPassword,
  onUpdate,
  onBack
}) => {
  const searchParams = useSearchParams();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Alerts
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Unlink confirmation modal states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [pendingUnlinkProvider, setPendingUnlinkProvider] = useState<string | null>(null);

  // Detect email mismatch error from URL query string
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam === 'OAuthEmailMismatch') {
      const msg = 'Security Reject: The email address on that social account does not match your registered CSCN Academy email.';
      setError(msg);
      toast.error(msg, { duration: 6000 });
      
      // Clean up the URL query parameters without full page reload
      if (window.history.replaceState) {
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        window.history.replaceState({ path: url.href }, '', url.href);
      }
    }
  }, [searchParams]);

  const handleLink = async (provider: 'google' | 'linkedin' | 'apple') => {
    if (provider === 'apple') {
      toast.error('Apple ID linking is coming soon.');
      return;
    }
    setActionLoading(provider);
    setSuccess('');
    setError('');
    
    try {
      // Initiate OAuth signin linking
      await signIn(provider, {
        callbackUrl: '/dashboard/settings',
      });
    } catch (err) {
      toast.error(`Failed to connect with ${provider}`);
      setError(`Failed to initiate account linking with ${provider}.`);
      setActionLoading(null);
    }
  };

  const triggerUnlink = (provider: string) => {
    setSuccess('');
    setError('');

    // Rule A Safety check: Prevent unlinking if it's the last remaining method
    if (!hasPassword && accounts.length <= 1) {
      const msg = 'Safety Guard: You cannot unlink your only login method. Please set a password in security settings first.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    setPendingUnlinkProvider(provider);
    setShowConfirmModal(true);
  };

  const confirmUnlink = async () => {
    if (!pendingUnlinkProvider) return;
    const provider = pendingUnlinkProvider;
    
    setShowConfirmModal(false);
    setPendingUnlinkProvider(null);
    setActionLoading(provider);

    try {
      const res = await unlinkOAuthAccount(provider);
      if (res.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        const msg = `${provider.toUpperCase()} account successfully disconnected.`;
        setSuccess(msg);
        toast.success(msg);
        await onUpdate();
      }
    } catch (err) {
      const msg = `Failed to disconnect ${provider} account.`;
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const isConnected = (provider: string) => accounts.some(a => a.provider === provider);
  const getConnectionDate = (provider: string) => {
    const acc = accounts.find(a => a.provider === provider);
    if (!acc) return null;
    return new Date(acc.createdAt).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full mx-auto space-y-6">
      
      {/* Back navigation header */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[13px] font-bold text-[#4B5563] hover:text-[#1C4ED1] transition-all cursor-pointer outline-none bg-none border-none p-0"
      >
        <ChevronLeft size={16} />
        Back to Account Settings
      </button>

      <div className="bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm font-jakarta overflow-hidden">
        {/* Header */}
        <div className="border-b border-[#E3E8F4] px-6 py-5 md:px-8 flex items-center justify-between bg-slate-50/40">
          <div>
            <h3 className="text-[15px] md:text-[16px] font-bold text-[#040B37]">
              Connected Accounts
            </h3>
            <p className="text-[12px] text-gray-400 font-semibold mt-1">
              Manage your external log-in channels. Accounts must share your registered CSCN email to connect.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          
          {/* Safety guard information block if password is missing */}
          {!hasPassword && (
            <div className="bg-amber-50 border border-amber-100 rounded-[12px] p-4 flex gap-3 text-amber-800">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
              <div className="space-y-1 text-[12px] font-medium leading-relaxed">
                <p className="font-extrabold text-amber-900">OAuth-Only Profile Protection</p>
                <p>
                  You do not currently have a backup account password set. To prevent getting locked out of your CSCN Academy dashboard, you must keep at least one social connection active, or set up a secure password in your Account Settings.
                </p>
              </div>
            </div>
          )}

          {/* Feedback alerts */}
          {(success || error) && (
            <div className="space-y-3 animate-in fade-in duration-200">
              {success && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-[10px] p-4 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <p className="text-[12px] font-bold text-emerald-800">{success}</p>
                </div>
              )}
              {error && (
                <div className="bg-rose-50 border border-rose-100 rounded-[10px] p-4 flex items-center gap-3">
                  <AlertCircle size={18} className="text-rose-600 shrink-0" />
                  <p className="text-[12px] font-bold text-rose-800">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Account connections stack */}
          <div className="space-y-4">
            
            {/* Google Row */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[12px] border transition-all ${
              isConnected('google') 
                ? 'border-[#E3E8F4] bg-[#F8FAFB]/40' 
                : 'border-dashed border-[#E3E8F4] bg-white hover:bg-slate-50/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-white border border-[#E3E8F4] flex items-center justify-center shrink-0 shadow-sm">
                  <Image src="/assets/dashboard/flat-color-icons_google.svg" alt="Google" width={24} height={24} />
                </div>
                <div>
                  <h4 className="text-[14px] font-extrabold text-[#040B37]">Google</h4>
                  <p className="text-[12px] text-gray-400 font-semibold mt-0.5">
                    {isConnected('google') 
                      && `Linked successfully on ${getConnectionDate('google')}` }
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex justify-end">
                {isConnected('google') ? (
                  <button
                    onClick={() => triggerUnlink('google')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-sm"
                  >
                    {actionLoading === 'google' ? <Loader2 size={13} className="animate-spin" /> : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink('google')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading === 'google' ? <Loader2 size={13} className="animate-spin" /> : 'Link Account'}
                  </button>
                )}
              </div>
            </div>

            {/* LinkedIn Row */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[12px] border transition-all ${
              isConnected('linkedin') 
                ? 'border-[#E3E8F4] bg-[#F8FAFB]/40' 
                : 'border-dashed border-[#E3E8F4] bg-white hover:bg-slate-50/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-white border border-[#E3E8F4] flex items-center justify-center shrink-0 shadow-sm">
                  <div className="w-6 h-6 flex items-center justify-center bg-[#0A66C2] rounded-[4px] text-white font-bold text-[13px]">in</div>
                </div>
                <div>
                  <h4 className="text-[14px] font-extrabold text-[#040B37]">LinkedIn</h4>
                  <p className="text-[12px] text-gray-400 font-semibold mt-0.5">
                    {isConnected('linkedin') 
                      && `Linked successfully on ${getConnectionDate('linkedin')}` }
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex justify-end">
                {isConnected('linkedin') ? (
                  <button
                    onClick={() => triggerUnlink('linkedin')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-sm"
                  >
                    {actionLoading === 'linkedin' ? <Loader2 size={13} className="animate-spin" /> : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink('linkedin')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading === 'linkedin' ? <Loader2 size={13} className="animate-spin" /> : 'Link Account'}
                  </button>
                )}
              </div>
            </div>

            {/* Apple Row */}
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-[12px] border transition-all ${
              isConnected('apple') 
                ? 'border-[#E3E8F4] bg-[#F8FAFB]/40' 
                : 'border-dashed border-[#E3E8F4] bg-white hover:bg-slate-50/30'
            }`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[10px] bg-white border border-[#E3E8F4] flex items-center justify-center shrink-0 shadow-sm">
                  <Image src="/assets/dashboard/mdi_apple.svg" alt="Apple" width={22} height={22} />
                </div>
                <div>
                  <h4 className="text-[14px] font-extrabold text-[#040B37]">Apple ID</h4>
                  <p className="text-[12px] text-gray-400 font-semibold mt-0.5">
                    {isConnected('apple') 
                      && `Linked successfully on ${getConnectionDate('apple')}` }
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex justify-end">
                {isConnected('apple') ? (
                  <button
                    onClick={() => triggerUnlink('apple')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-600 disabled:opacity-50 rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-sm"
                  >
                    {actionLoading === 'apple' ? <Loader2 size={13} className="animate-spin" /> : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLink('apple')}
                    disabled={actionLoading !== null}
                    className="px-4 py-2 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[8px] text-[12px] font-bold transition-all cursor-pointer outline-none shadow-md flex items-center gap-1.5"
                  >
                    {actionLoading === 'apple' ? <Loader2 size={13} className="animate-spin" /> : 'Link Account'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-[#040B37]/65 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#E3E8F4] w-full max-w-md rounded-[16px] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => { setShowConfirmModal(false); setPendingUnlinkProvider(null); }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer outline-none transition-colors"
            >
              <X size={18} />
            </button>

            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-[16px] font-black text-[#040B37]">Disconnect Sign-in Channel?</h3>
              <p className="text-[13px] text-gray-400 font-semibold leading-relaxed">
                Are you sure you want to disconnect your <strong>{pendingUnlinkProvider?.toUpperCase()}</strong> authentication provider? You will no longer be able to log in with this method.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => { setShowConfirmModal(false); setPendingUnlinkProvider(null); }}
                className="w-full py-2.5 bg-slate-50 border border-[#E3E8F4] hover:bg-slate-100 text-[13px] font-bold text-[#4B5563] rounded-[8px] transition-all cursor-pointer outline-none"
              >
                Keep Connected
              </button>
              <button
                onClick={confirmUnlink}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-bold rounded-[8px] transition-all cursor-pointer outline-none"
              >
                Yes, Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
