'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Coins, 
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import { updatePayoutSettings } from '@/actions/settings';

const NIGERIAN_BANKS = [
  { code: 'access', name: 'Access Bank' },
  { code: 'gtbank', name: 'GTBank (Guaranty Trust Bank)' },
  { code: 'zenith', name: 'Zenith Bank' },
  { code: 'uba', name: 'UBA (United Bank for Africa)' },
  { code: 'sterling', name: 'Sterling Bank' },
  { code: 'firstbank', name: 'First Bank of Nigeria' },
  { code: 'fidelity', name: 'Fidelity Bank' },
  { code: 'wema', name: 'Wema Bank' },
  { code: 'stanbic', name: 'Stanbic IBTC Bank' },
  { code: 'kuda', name: 'Kuda Bank' },
  { code: 'opay', name: 'OPay Digital Services' },
  { code: 'palmpay', name: 'PalmPay' },
  { code: 'moniepoint', name: 'Moniepoint MFB' },
  { code: 'union', name: 'Union Bank' },
  { code: 'ecobank', name: 'Ecobank Nigeria' },
];

const CRYPTO_NETWORKS = [
  { id: 'TRC20', name: 'USDT – TRC-20 (Tron Network)', coin: 'USDT' },
  { id: 'BEP20', name: 'USDT – BEP-20 (Binance Smart Chain)', coin: 'USDT' },
  { id: 'SOL', name: 'USDC – SPL (Solana Network)', coin: 'USDC' },
];

const OTHER_METHODS = [
  { id: 'paypal', name: 'PayPal' },
  { id: 'stripe', name: 'Stripe Account' },
  { id: 'payoneer', name: 'Payoneer' },
];

interface SelectOption {
  id?: string;
  code?: string;
  name: string;
  coin?: string;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  getOptionId: (opt: SelectOption) => string;
  renderOption?: (opt: SelectOption) => React.ReactNode;
  renderSelected?: (opt: SelectOption | undefined) => React.ReactNode;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  placeholder = '-- Select --',
  getOptionId,
  renderOption,
  renderSelected,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOpt = options.find(o => getOptionId(o) === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 h-[48px] rounded-[10px] border text-[14px] font-semibold text-left outline-none transition-all cursor-pointer ${
          isOpen
            ? 'border-[#1C4ED1] ring-4 ring-[#1C4ED1]/8 bg-white'
            : 'border-[#E3E8F4] bg-white hover:border-[#1C4ED1]/40'
        }`}
      >
        <span className={selectedOpt ? 'text-[#040B37]' : 'text-gray-400'}>
          {selectedOpt
            ? (renderSelected ? renderSelected(selectedOpt) : selectedOpt.name)
            : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-[#E3E8F4] rounded-[12px] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[240px] overflow-y-auto">
          {options.map(opt => {
            const id = getOptionId(opt);
            const isSelected = id === value;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { onChange(id); setIsOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3 text-[13px] font-semibold text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1C4ED1]/5 text-[#1C4ED1]'
                    : 'text-[#4B5563] hover:bg-[#F4F6FB]'
                }`}
              >
                <span>{renderOption ? renderOption(opt) : opt.name}</span>
                {isSelected && <Check size={14} className="text-[#1C4ED1] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface PayoutSettingsProps {
  initialMethod?: string;
  initialDetails?: any;
  onSaveSuccess?: () => void;
}

export const InstructorPayoutSettings: React.FC<PayoutSettingsProps> = ({
  initialMethod = 'BANK',
  initialDetails = {},
  onSaveSuccess,
}) => {
  const [method, setMethod] = useState<string>(initialMethod || 'BANK');

  // Bank fields — manual entry (no mock API)
  const [bankCode, setBankCode] = useState<string>(initialDetails.bankCode || '');
  const [accountNumber, setAccountNumber] = useState<string>(initialDetails.accountNumber || '');
  const [accountName, setAccountName] = useState<string>(initialDetails.accountName || '');

  // Crypto fields
  const [cryptoNetwork, setCryptoNetwork] = useState<string>(initialDetails.cryptoNetwork || 'TRC20');
  const [cryptoAddress, setCryptoAddress] = useState<string>(initialDetails.cryptoAddress || '');

  // Other method fields
  const [customMethodType, setCustomMethodType] = useState<string>(initialDetails.customMethodType || 'paypal');
  const [customIdentifier, setCustomIdentifier] = useState<string>(initialDetails.customIdentifier || '');

  // General State
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>('');
  const [saveError, setSaveError] = useState<string>('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    let details: any = {};

    if (method === 'BANK') {
      if (!bankCode) {
        setSaveError('Please select a bank.');
        setIsSaving(false);
        return;
      }
      if (!accountNumber || accountNumber.length < 8) {
        setSaveError('Please enter a valid account number (at least 8 digits).');
        setIsSaving(false);
        return;
      }
      if (!accountName.trim()) {
        setSaveError('Please enter your account name as it appears on your bank records.');
        setIsSaving(false);
        return;
      }
      const selectedBankName = NIGERIAN_BANKS.find(b => b.code === bankCode)?.name || '';
      details = {
        bankCode,
        bankName: selectedBankName,
        accountNumber,
        accountName: accountName.trim().toUpperCase(),
      };
    } else if (method === 'CRYPTO') {
      if (!cryptoAddress.trim()) {
        setSaveError('Please enter a valid wallet address.');
        setIsSaving(false);
        return;
      }
      details = {
        cryptoNetwork,
        cryptoAddress: cryptoAddress.trim(),
      };
    } else if (method === 'OTHER') {
      if (!customIdentifier.trim()) {
        setSaveError('Please enter your payout account details/email.');
        setIsSaving(false);
        return;
      }
      details = {
        customMethodType,
        customIdentifier: customIdentifier.trim(),
      };
    }

    try {
      const res = await updatePayoutSettings({
        payoutMethod: method,
        payoutDetails: details,
      });

      if (res.error) {
        setSaveError(res.error);
      } else {
        setSaveSuccess('Payout details successfully updated!');
        if (onSaveSuccess) onSaveSuccess();
      }
    } catch (err) {
      setSaveError('Failed to save payout settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBank = NIGERIAN_BANKS.find(b => b.code === bankCode);
  const selectedCrypto = CRYPTO_NETWORKS.find(n => n.id === cryptoNetwork);

  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] shadow-sm font-jakarta w-full">
      {/* Header */}
      <div className="border-b border-[#E3E8F4] px-6 py-5 md:px-8">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37]">
          Instructor Payouts Setup
        </h3>
        <p className="text-[13px] text-gray-400 font-medium mt-1">
          Configure how you would like to receive your monthly earnings.
        </p>
      </div>

      {/* Selector Grid */}
      <div className="p-6 md:p-8 space-y-6">
        <div>
          <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Preferred Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setMethod('BANK')}
              className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all text-left outline-none cursor-pointer ${
                method === 'BANK'
                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]'
                  : 'border-[#E3E8F4] bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 size={20} className={method === 'BANK' ? 'text-[#1C4ED1]' : 'text-gray-400'} />
              <div>
                <p className="font-bold text-[14px]">Local Bank</p>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">Nigeria Transfers</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('CRYPTO')}
              className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all text-left outline-none cursor-pointer ${
                method === 'CRYPTO'
                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]'
                  : 'border-[#E3E8F4] bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Wallet size={20} className={method === 'CRYPTO' ? 'text-[#1C4ED1]' : 'text-gray-400'} />
              <div>
                <p className="font-bold text-[14px]">Cryptocurrency</p>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">USDT / USDC</p>
              </div>
            </button>

            <button
              onClick={() => setMethod('OTHER')}
              className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all text-left outline-none cursor-pointer ${
                method === 'OTHER'
                  ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1]'
                  : 'border-[#E3E8F4] bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Coins size={20} className={method === 'OTHER' ? 'text-[#1C4ED1]' : 'text-gray-400'} />
              <div>
                <p className="font-bold text-[14px]">Other Channels</p>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">PayPal, Stripe, etc.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Forms */}
        <div className="pt-4 border-t border-[#E3E8F4] space-y-4">
          {method === 'BANK' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-[#F4F6FB] border border-[#E3E8F4] rounded-[10px] p-3.5 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#1C4ED1] mt-0.5 shrink-0" />
                <p className="text-[12px] font-semibold text-[#4B5563] leading-relaxed">
                  Enter your bank details exactly as they appear on your bank records. We will verify before processing any payouts.
                </p>
              </div>

              <CustomSelect
                label="Select Bank"
                value={bankCode}
                options={NIGERIAN_BANKS}
                onChange={setBankCode}
                placeholder="-- Choose your bank --"
                getOptionId={(o) => o.code!}
                renderOption={(o) => o.name}
              />

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter your account number"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  Account Name <span className="text-[11px] font-medium text-gray-400">(as it appears on your bank records)</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. JOHN DOE"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all uppercase"
                />
              </div>

              {/* Preview card */}
              {bankCode && accountNumber && accountName && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-[10px] p-3.5 flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Payout Destination</p>
                    <p className="text-[14px] font-black text-emerald-950 mt-0.5">{accountName.toUpperCase()}</p>
                    <p className="text-[12px] font-semibold text-emerald-700 mt-0.5">
                      {selectedBank?.name} — {accountNumber}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {method === 'CRYPTO' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-[10px] p-3.5 flex items-start gap-2.5">
                <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[12px] font-semibold text-amber-800 leading-relaxed">
                  Double-check your wallet address. Blockchain transfers are irreversible. Ensure the address matches the selected network.
                </p>
              </div>

              <CustomSelect
                label="Select Network & Coin"
                value={cryptoNetwork}
                options={CRYPTO_NETWORKS}
                onChange={setCryptoNetwork}
                placeholder="-- Choose network --"
                getOptionId={(o) => o.id!}
                renderOption={(o) => (
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black rounded bg-[#1C4ED1]/10 text-[#1C4ED1]">{o.coin}</span>
                    {o.name}
                  </span>
                )}
                renderSelected={(o) => o ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black rounded bg-[#1C4ED1]/10 text-[#1C4ED1]">{o.coin}</span>
                    {o.name}
                  </span>
                ) : undefined}
              />

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  {selectedCrypto?.coin} Wallet Address
                </label>
                <input
                  type="text"
                  value={cryptoAddress}
                  onChange={(e) => setCryptoAddress(e.target.value)}
                  placeholder={
                    cryptoNetwork === 'SOL'
                      ? 'Solana address (e.g. 5XmKj...)'
                      : cryptoNetwork === 'BEP20'
                      ? 'BEP-20 address (e.g. 0x1a2b...)'
                      : 'TRC-20 address (e.g. TXyz123...)'
                  }
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all font-mono"
                />
              </div>
            </div>
          )}

          {method === 'OTHER' && (
            <div className="space-y-4">
              <CustomSelect
                label="Select Payout Service"
                value={customMethodType}
                options={OTHER_METHODS}
                onChange={setCustomMethodType}
                placeholder="-- Choose a service --"
                getOptionId={(o) => o.id!}
                renderOption={(o) => o.name}
              />

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  Account Details (Email / Account ID / Username)
                </label>
                <input
                  type="text"
                  value={customIdentifier}
                  onChange={(e) => setCustomIdentifier(e.target.value)}
                  placeholder={
                    customMethodType === 'paypal'
                      ? 'Enter PayPal email address'
                      : customMethodType === 'stripe'
                      ? 'Enter Stripe account email'
                      : 'Enter Payoneer email address'
                  }
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action feedback info */}
        {(saveError || saveSuccess) && (
          <div className="pt-2">
            {saveError && (
              <div className="bg-rose-50 border border-rose-100 rounded-[10px] p-4 flex items-center gap-3">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <p className="text-[13px] font-bold text-rose-800">{saveError}</p>
              </div>
            )}
            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-[10px] p-4 flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-[13px] font-bold text-emerald-800">{saveSuccess}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-4 border-t border-[#E3E8F4]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto px-8 py-3.5 bg-[#1C4ED1] hover:bg-[#163BB1] disabled:opacity-50 text-white rounded-[10px] text-[15px] font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Save Payout Settings
          </button>
        </div>
      </div>
    </div>
  );
};
