'use client';

import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  X,
  ChevronLeft,
  Computer,
  SmartphoneIcon,
  Mail,
  Eye,
  EyeOff
} from 'lucide-react';
import { SettingsToggle } from './SettingsToggle';
import { signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { ConnectedAccountsSettings } from './ConnectedAccountsSettings';
import { 
  changePassword, 
  toggle2FA, 
  revokeActiveSession,
  sendPasswordChangeOTP,
  generate2FASetup,
  deleteUserAccount
} from '@/actions/settings';

type ViewState = 'list' | 'change-password' | 'active-sessions' | 'delete-account' | 'connected-accounts';

interface AccountSettingsProps {
  initialData: any;
  onUpdate: () => Promise<void>;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ initialData, onUpdate }) => {
  const searchParams = useSearchParams();
  
  // Sync state with server preloaded props
  const [securityData, setSecurityData] = useState<any>(initialData);
  const hasPassword = securityData?.hasPassword ?? true;

  useEffect(() => {
    setSecurityData(initialData);
  }, [initialData]);

  // View state switcher
  const [currentView, setCurrentView] = useState<ViewState>('list');

  // Automatically focus the connected-accounts sub-view if redirected back with OAuthEmailMismatch
  useEffect(() => {
    if (searchParams.get('error') === 'OAuthEmailMismatch') {
      setCurrentView('connected-accounts');
    }
  }, [searchParams]);

  // Modal state for 2FA validation
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);

  // Form Inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  // Show/Hide password states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isNewPasswordFocused, setIsNewPasswordFocused] = useState(false);
  
  // Password criteria checklist calculation
  const passwordCriteria = [
    { label: "Uppercase letter", met: /[A-Z]/.test(newPassword) },
    { label: "Lowercase letter", met: /[a-z]/.test(newPassword) },
    { label: "Number", met: /\d/.test(newPassword) },
    { label: "Special character (e.g. !?<>@#$%)", met: /[!@#$%^&*(),.?":{}|<>_~`+\-=\[\]\\';/ ]/.test(newPassword) },
    { label: "8 characters or more", met: newPassword.length >= 8 },
  ];
  const isNewPasswordSecure = passwordCriteria.every(c => c.met);

  // 2FA Verification input
  const [totpCode, setTotpCode] = useState('');

  // Delete Account Confirmation input
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState('');

  // Status & loading indicators
  const [passwordStatus, setPasswordStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [otpSentStatus, setOtpSentStatus] = useState<{ success?: string; error?: string } | null>(null);
  
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [revokeLoading, setRevokeLoading] = useState<string | null>(null);
  
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // OTP triggers
  const handleSendOTP = async () => {
    setIsOtpLoading(true);
    setOtpSentStatus(null);
    try {
      const res = await sendPasswordChangeOTP();
      if (res.error) {
        setOtpSentStatus({ error: res.error });
      } else {
        setOtpSentStatus({ success: res.success || "Verification code sent to your email!" });
      }
    } catch (err) {
      setOtpSentStatus({ error: "Failed to send verification code email." });
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!isNewPasswordSecure) {
      setPasswordStatus({ error: "Please ensure your new password meets all security criteria." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ error: "New passwords do not match." });
      return;
    }
    if (!otpCode || otpCode.length !== 6) {
      setPasswordStatus({ error: "Please enter the 6-digit verification code sent to your email." });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword({ currentPassword, newPassword, otpCode });
      if (res.error) {
        setPasswordStatus({ error: res.error });
      } else {
        setPasswordStatus({ success: "Password successfully updated!" });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setOtpCode('');
        setOtpSentStatus(null);
        
        // Refresh local data & return to main view
        await onUpdate();
        setTimeout(() => {
          setCurrentView('list');
          setPasswordStatus(null);
        }, 1500);
      }
    } catch (err) {
      setPasswordStatus({ error: "An unexpected error occurred." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handle2FAToggle = async (checked: boolean) => {
    if (checked) {
      setTwoFactorLoading(true);
      setTwoFactorError('');
      try {
        const res = await generate2FASetup();
        if (res.error) {
          alert(res.error);
        } else {
          setSetup2FAData({
            secret: res.secret || '',
            qrCodeUrl: res.qrCodeUrl || ''
          });
          setIs2FAModalOpen(true);
        }
      } catch (err) {
        console.error("2FA initialization failed", err);
      } finally {
        setTwoFactorLoading(false);
      }
    } else {
      setTwoFactorLoading(true);
      try {
        const res = await toggle2FA(false);
        if (res.success) {
          await onUpdate();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setTwoFactorLoading(false);
      }
    }
  };

  const handle2FAVerify = async () => {
    setTwoFactorLoading(true);
    setTwoFactorError('');

    try {
      const res = await toggle2FA(true, totpCode);
      if (res.error) {
        setTwoFactorError(res.error);
      } else {
        await onUpdate();
        setIs2FAModalOpen(false);
        setTotpCode('');
        setSetup2FAData(null);
      }
    } catch (err) {
      setTwoFactorError("Failed to enable two-factor authentication.");
    } finally {
      setTwoFactorLoading(false);
    }
  };

  const handleRevokeSession = async (id: string) => {
    setRevokeLoading(id);
    try {
      const res = await revokeActiveSession(id);
      if (res.success) {
        await onUpdate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRevokeLoading(null);
    }
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setDeleteLoading(true);

    try {
      const res = await deleteUserAccount(deleteEmailConfirm);
      if (res.error) {
        setDeleteError(res.error);
      } else {
        // Trigger client-side sign out and redirect to signin page
        await signOut({ callbackUrl: '/signin' });
      }
    } catch (err) {
      setDeleteError("An unexpected error occurred during account deletion.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm w-full font-jakarta overflow-hidden">
      
      {/* 1. MAIN SETTINGS LIST VIEW */}
      {currentView === 'list' && (
        <>
          {/* Header */}
          <div className="bg-white border-b border-[#E3E8F4] px-6 h-[64px] flex items-center">
            <h3 className="text-[16px] font-bold text-[#040B37]">
              Account Settings
            </h3>
          </div>

          <div className="flex flex-col">
            {/* Row 1: Change Password */}
            <div className="h-[80px] border-b border-[#E3E8F4] px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
                  Change Password
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
                  Update your account password
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('change-password')}
                className="border border-[#E3E8F4] bg-white px-4 py-2 text-[12px] font-bold text-[#4B5563] rounded-[8px] hover:bg-slate-50 transition-all cursor-pointer outline-none"
              >
                Change
              </button>
            </div>

            {/* Row 2: 2FA Authentication */}
            <div className="h-[80px] border-b border-[#E3E8F4] px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
                  Two-Factor Authentication
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
                  Add an extra layer of security
                </p>
              </div>
              <div className="flex items-center gap-3">
                {twoFactorLoading && <Loader2 size={14} className="text-[#1C4ED1] animate-spin" />}
                <SettingsToggle 
                  checked={securityData?.twoFactorEnabled || false} 
                  onChange={handle2FAToggle} 
                />
              </div>
            </div>

            {/* Row 3: Active Sessions */}
            <div className="h-[80px] border-b border-[#E3E8F4] px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
                  Active Sessions
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
                  Manage devices with active sessions
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('active-sessions')}
                className="border border-[#E3E8F4] bg-white px-4 py-2 text-[12px] font-bold text-[#4B5563] rounded-[8px] hover:bg-slate-50 transition-all cursor-pointer outline-none"
              >
                View
              </button>
            </div>

            {/* Row 4: Connected Accounts */}
            <div className="h-[80px] border-b border-[#E3E8F4] px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] md:text-[15px] font-bold text-[#4B5563]">
                  Connected Accounts
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
                  Manage linked Google and LinkedIn login methods
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('connected-accounts')}
                className="border border-[#E3E8F4] bg-white px-4 py-2 text-[12px] font-bold text-[#4B5563] rounded-[8px] hover:bg-slate-50 transition-all cursor-pointer outline-none"
              >
                Manage
              </button>
            </div>

            {/* Row 5: Delete Account */}
            <div className="h-[80px] px-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <h4 className="text-[14px] md:text-[15px] font-bold text-[#FF383C]">
                  Delete Account
                </h4>
                <p className="text-[11px] md:text-[12px] font-medium text-[#9CA3AF]">
                  Permanently delete your account and data
                </p>
              </div>
              <button 
                onClick={() => setCurrentView('delete-account')}
                className="border border-[#FF383C] bg-[rgba(255,56,60,0.08)] px-4 py-2 text-[12px] font-bold text-[#FF383C] rounded-[8px] hover:bg-[#FF383C] hover:text-white transition-all cursor-pointer outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2. CHANGE PASSWORD INNER VIEW */}
      {currentView === 'change-password' && (
        <div className="animate-in fade-in slide-in-from-right duration-250">
          <div className="border-b border-[#E3E8F4] px-6 h-[64px] flex items-center gap-3 bg-white">
            <button 
              onClick={() => {
                setCurrentView('list');
                setPasswordStatus(null);
                setOtpSentStatus(null);
              }}
              className="text-[#4B5563] hover:text-[#1C4ED1] transition-colors cursor-pointer outline-none flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-[15px] md:text-[16px] font-extrabold text-[#040B37]">
              Change Account Password
            </h3>
          </div>

          <div className="p-6 md:p-8 bg-[#F8FAFB]/40">
            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-2xl">
              {/* Step A: Request OTP verification */}
              <div className="bg-white border border-[#E3E8F4] rounded-[12px] p-4 space-y-3">
                <p className="text-[12px] font-bold text-[#4B5563] flex items-center gap-1.5">
                  <Mail size={14} className="text-[#1C4ED1]" />
                  Verify Identity First
                </p>
                <p className="text-[11px] font-medium text-gray-400">
                  To update your password, request a 6-digit security code to your registered email address.
                </p>
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={isOtpLoading}
                  className="w-full py-2 bg-slate-50 border border-[#E3E8F4] hover:bg-slate-100 disabled:opacity-50 text-[12px] font-bold text-[#4B5563] rounded-[8px] flex items-center justify-center gap-2 transition-all cursor-pointer outline-none"
                >
                  {isOtpLoading && <Loader2 size={13} className="animate-spin" />}
                  Send Security Verification Code
                </button>

                {otpSentStatus && (
                  <div className="pt-1">
                    {otpSentStatus.error && (
                      <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {otpSentStatus.error}
                      </p>
                    )}
                    {otpSentStatus.success && (
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {otpSentStatus.success}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Password inputs */}
              <div>
                <label className="text-[12px] font-extrabold text-[#4B5563] block mb-1.5">
                  {hasPassword ? 'Current Password' : 'Current Password (not needed)'}
                </label>
                {!hasPassword && (
                  <p className="mb-2 text-[11px] font-semibold leading-relaxed text-[#9CA3AF]">
                    This account currently signs in with OAuth. Leave this blank and use the email code to create your first password.
                  </p>
                )}
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required={hasPassword}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={hasPassword ? "Enter current password" : "Leave blank for OAuth accounts"}
                    className="w-full px-4 py-3 pr-11 rounded-[10px] border border-[#E3E8F4] text-[13px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none flex items-center justify-center"
                  >
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-[#4B5563] block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setIsNewPasswordFocused(true)}
                    onBlur={() => setIsNewPasswordFocused(false)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 pr-11 rounded-[10px] border border-[#E3E8F4] text-[13px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none flex items-center justify-center"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Accordion reveal password strength checklist */}
                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNewPasswordFocused || newPassword.length > 0 ? 'max-h-[220px] opacity-100 mt-2.5' : 'max-h-0 opacity-0'}`}>
                  <div className="space-y-2 p-4 bg-[#F8FAFB] rounded-[12px] border border-[#E3E8F4]">
                    {passwordCriteria.map((c, idx) => (
                      <div key={idx} className="flex items-center gap-2.5 text-[13px] font-semibold transition-colors duration-200">
                        <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                          c.met 
                            ? 'border-emerald-500 bg-emerald-500 text-white' 
                            : 'border-gray-300 bg-white text-transparent'
                        }`}>
                          {c.met ? (
                            <svg className="w-2.5 h-2.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            <div className="w-1 h-1 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <span className={c.met ? 'text-[#040B37] font-medium' : 'text-gray-400 font-medium'}>
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-[#4B5563] block mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full px-4 py-3 pr-11 rounded-[10px] border border-[#E3E8F4] text-[13px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none flex items-center justify-center"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[12px] font-extrabold text-[#4B5563] block mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit code sent to email"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[13px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white tracking-widest"
                />
              </div>

              {passwordStatus && (
                <div className="pt-2">
                  {passwordStatus.error && (
                    <div className="bg-rose-50 border border-rose-100 rounded-[10px] p-3.5 flex items-center gap-2 text-rose-800 text-[12px] font-bold">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{passwordStatus.error}</span>
                    </div>
                  )}
                  {passwordStatus.success && (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-[10px] p-3.5 flex items-center gap-2 text-emerald-800 text-[12px] font-bold">
                      <CheckCircle2 size={16} className="shrink-0" />
                      <span>{passwordStatus.success}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="px-5 py-3 border border-[#E3E8F4] bg-white text-gray-500 rounded-[10px] text-[13px] font-bold hover:bg-slate-50 transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-6 py-3 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[10px] text-[13px] font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer outline-none"
                >
                  {passwordLoading && <Loader2 size={14} className="animate-spin" />}
                  Verify & Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. ACTIVE SESSIONS INNER VIEW */}
      {currentView === 'active-sessions' && (
        <div className="animate-in fade-in slide-in-from-right duration-250">
          <div className="border-b border-[#E3E8F4] px-6 h-[64px] flex items-center gap-3 bg-white">
            <button 
              onClick={() => setCurrentView('list')}
              className="text-[#4B5563] hover:text-[#1C4ED1] transition-colors cursor-pointer outline-none flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-[15px] md:text-[16px] font-extrabold text-[#040B37]">
              Connected Login Sessions
            </h3>
          </div>

          <div className="p-6 md:p-8 bg-[#F8FAFB]/40 space-y-4">
            <p className="text-[12px] font-medium text-gray-400">
              You are currently signed into CSCN on these devices. Revoke any unfamiliar session instantly.
            </p>

            <div className="space-y-3">
              {securityData?.sessions?.length === 0 ? (
                <p className="text-[13px] text-gray-400 font-bold py-2">No active sessions found.</p>
              ) : (
                securityData?.sessions?.map((session: any) => {
                  const isMobile = session.device.toLowerCase().includes('iphone') || session.device.toLowerCase().includes('android');
                  return (
                    <div 
                      key={session.id} 
                      className="bg-white border border-[#E3E8F4] rounded-[12px] p-4 flex items-center justify-between gap-4 shadow-sm hover:border-[#1C4ED1]/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-slate-50 flex items-center justify-center text-[#4B5563] shrink-0 border border-slate-100">
                          {isMobile ? <SmartphoneIcon size={18} /> : <Computer size={18} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-extrabold text-[#040B37]">{session.device}</p>
                            {session.active && (
                              <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-2 py-0.5 tracking-wider uppercase">
                                Current Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-gray-400 mt-0.5">IP Address: {session.ip} • Logged in: {new Date(session.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {!session.active && (
                        <button
                          onClick={() => handleRevokeSession(session.id)}
                          disabled={revokeLoading === session.id}
                          className="p-2 bg-rose-50 hover:bg-rose-500 hover:text-white rounded-[8px] text-rose-500 border border-rose-100 hover:border-rose-500 transition-all cursor-pointer outline-none"
                          title="Revoke session and log out device"
                        >
                          {revokeLoading === session.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setCurrentView('list')}
                className="px-6 py-2.5 bg-[#1C4ED1] hover:bg-[#163BB1] text-white rounded-[10px] text-[13px] font-bold transition-all shadow-md cursor-pointer outline-none"
              >
                Back to Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONNECTED ACCOUNTS INNER VIEW */}
      {currentView === 'connected-accounts' && (
        <div className="animate-in fade-in slide-in-from-right duration-250 p-6 md:p-8">
          <ConnectedAccountsSettings 
            accounts={securityData?.accounts || []}
            hasPassword={securityData?.hasPassword ?? true}
            onUpdate={onUpdate}
            onBack={() => setCurrentView('list')}
          />
        </div>
      )}

      {/* 4. DELETE ACCOUNT INNER VIEW */}
      {currentView === 'delete-account' && (
        <div className="animate-in fade-in slide-in-from-right duration-250">
          <div className="border-b border-[#E3E8F4] px-6 h-[64px] flex items-center gap-3 bg-white">
            <button 
              onClick={() => {
                setCurrentView('list');
                setDeleteEmailConfirm('');
                setDeleteError('');
              }}
              className="text-[#4B5563] hover:text-[#1C4ED1] transition-colors cursor-pointer outline-none flex items-center justify-center"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-[15px] md:text-[16px] font-extrabold text-[#FF383C]">
              Permanently Delete Account
            </h3>
          </div>

          <div className="p-6 md:p-8 bg-rose-50/20 space-y-6">
            <div className="bg-rose-50 border border-rose-100 rounded-[12px] p-4 flex gap-3 text-rose-800">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div className="space-y-1 text-[12px] font-medium leading-relaxed">
                <p className="font-bold text-rose-900">Warning: This action is irreversible.</p>
                <p>Deleting your account will permanently wipe all course enrollments, achievement cards, watch logs, exam records, and personal settings from CSCN Academy database systems.</p>
              </div>
            </div>

            <form onSubmit={handleDeleteAccountSubmit} className="space-y-5 max-w-2xl">
              <div>
                <label className="text-[12px] font-extrabold text-[#4B5563] block mb-1.5">
                  Confirm Registered Email Address
                </label>
                <input
                  type="email"
                  required
                  value={deleteEmailConfirm}
                  onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                  placeholder="Enter your email to confirm deletion"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[13px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-rose-500 bg-white"
                />
              </div>

              {deleteError && (
                <div className="bg-rose-50 border border-rose-100 rounded-[10px] p-3.5 flex items-center gap-2 text-rose-800 text-[12px] font-bold">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setCurrentView('list')}
                  className="px-5 py-3 border border-[#E3E8F4] bg-white text-gray-500 rounded-[10px] text-[13px] font-bold hover:bg-slate-50 transition-all cursor-pointer outline-none whitespace-nowrap"
                >
                  Keep Account
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className="px-6 py-3 bg-[#FF383C] hover:bg-[#D3282C] disabled:opacity-50 text-white rounded-[10px] text-[13px] font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer outline-none whitespace-nowrap"
                >
                  {deleteLoading && <Loader2 size={14} className="animate-spin" />}
                  Confirm Deletion & Sign Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA SETUP MODAL */}
      {is2FAModalOpen && setup2FAData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E3E8F4] rounded-[16px] w-full max-w-[500px] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setIs2FAModalOpen(false);
                setTotpCode('');
                setTwoFactorError('');
                setSetup2FAData(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-[#040B37] cursor-pointer outline-none"
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className="p-6 border-b border-[#E3E8F4] text-center">
              <div className="w-12 h-12 rounded-full bg-[#1C4ED1]/5 flex items-center justify-center text-[#1C4ED1] mx-auto mb-3 border border-[#1C4ED1]/10">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-[16px] font-black text-[#040B37]">Enable Two-Factor Authentication</h4>
              <p className="text-[12px] font-medium text-gray-400 mt-1">
                Scan this QR code with your authenticator app (Google Authenticator, Duo, or Authy) to link your account.
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Actual QR Code - Enlarged */}
              <div className="w-56 h-56 bg-white border border-[#E3E8F4] rounded-[12px] mx-auto flex items-center justify-center p-2 relative shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={setup2FAData.qrCodeUrl} 
                  alt="2FA Setup QR Code"
                  className="w-52 h-52 object-contain"
                />
              </div>

              {/* Secret Key */}
              <div className="bg-slate-50 border border-slate-100 rounded-[10px] p-3 text-center">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Authenticator Secret Key</p>
                <p className="text-[14px] font-black text-[#040B37] tracking-wider mt-1 select-all font-mono">{setup2FAData.secret}</p>
              </div>

              {/* Verification Code Input */}
              <div className="space-y-2">
                <label className="text-[12px] font-extrabold text-[#4B5563] block">
                  Verify Authenticator 6-Digit PIN Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 6-digit pin code"
                  className="w-full text-center tracking-widest text-[20px] font-black px-4 py-2.5 rounded-[10px] border border-[#E3E8F4] text-[#040B37] placeholder:text-[13px] placeholder:font-bold placeholder:tracking-normal placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] font-mono"
                />
              </div>

              {twoFactorError && (
                <div className="bg-rose-50 border border-rose-100 rounded-[8px] p-3 flex items-center gap-2 text-rose-800 text-[12px] font-bold">
                  <AlertCircle size={15} />
                  <span>{twoFactorError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-[#E3E8F4] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setIs2FAModalOpen(false);
                  setTotpCode('');
                  setTwoFactorError('');
                  setSetup2FAData(null);
                }}
                className="px-5 py-2.5 bg-white border border-[#E3E8F4] text-gray-600 rounded-[8px] text-[13px] font-bold hover:bg-gray-50 transition-all cursor-pointer outline-none whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handle2FAVerify}
                disabled={twoFactorLoading || totpCode.length !== 6}
                className="px-6 py-2.5 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[8px] text-[13px] font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer outline-none whitespace-nowrap"
              >
                {twoFactorLoading && <Loader2 size={14} className="animate-spin" />}
                Verify & Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
