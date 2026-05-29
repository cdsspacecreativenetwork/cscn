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
  { code: '', name: 'Loading Paystack banks...' },
];

const GHANAIAN_BANKS = [
  { code: 'gcb', name: 'GCB Bank' },
  { code: 'ecobank-gh', name: 'Ecobank Ghana' },
  { code: 'absa-gh', name: 'Absa Bank Ghana' },
  { code: 'fidelity-gh', name: 'Fidelity Bank Ghana' },
  { code: 'stanbic-gh', name: 'Stanbic Bank Ghana' },
  { code: 'mtn-momo-gh', name: 'MTN Mobile Money' },
  { code: 'vodafone-cash-gh', name: 'Vodafone Cash' },
];

const RWANDAN_BANKS = [
  { code: 'bk', name: 'Bank of Kigali' },
  { code: 'equity-rw', name: 'Equity Bank Rwanda' },
  { code: 'im-rw', name: 'I&M Bank Rwanda' },
  { code: 'mtn-momo-rw', name: 'MTN Mobile Money Rwanda' },
  { code: 'airtel-money-rw', name: 'Airtel Money Rwanda' },
];

const COUNTRY_CURRENCIES = [
  { code: 'NG', name: 'Nigeria', currency: 'NGN' },
  { code: 'GH', name: 'Ghana', currency: 'GHS' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB' },
  { code: 'KE', name: 'Kenya', currency: 'KES' },
  { code: 'UG', name: 'Uganda', currency: 'UGX' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF' },
  { code: 'CI', name: "Cote d'Ivoire", currency: 'XOF' },
  { code: 'SN', name: 'Senegal', currency: 'XOF' },
  { code: 'EG', name: 'Egypt', currency: 'EGP' },
  { code: 'MA', name: 'Morocco', currency: 'MAD' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR' },
  { code: 'IE', name: 'Ireland', currency: 'EUR' },
  { code: 'DE', name: 'Germany', currency: 'EUR' },
  { code: 'FR', name: 'France', currency: 'EUR' },
  { code: 'ES', name: 'Spain', currency: 'EUR' },
  { code: 'IT', name: 'Italy', currency: 'EUR' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR' },
  { code: 'BE', name: 'Belgium', currency: 'EUR' },
  { code: 'PT', name: 'Portugal', currency: 'EUR' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF' },
  { code: 'SE', name: 'Sweden', currency: 'SEK' },
  { code: 'NO', name: 'Norway', currency: 'NOK' },
  { code: 'DK', name: 'Denmark', currency: 'DKK' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR' },
  { code: 'BD', name: 'Bangladesh', currency: 'BDT' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR' },
  { code: 'TR', name: 'Turkey', currency: 'TRY' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'PH', name: 'Philippines', currency: 'PHP' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR' },
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
].sort((a, b) => a.name.localeCompare(b.name));

type CountryCurrency = {
  code: string;
  name: string;
  currency: string;
};

const LOCAL_BANK_RAILS: Record<string, typeof NIGERIAN_BANKS> = {
  NG: NIGERIAN_BANKS,
  GH: GHANAIAN_BANKS,
  RW: RWANDAN_BANKS,
};

const getCountry = (code: string) => COUNTRY_CURRENCIES.find((country) => country.code === code) ?? COUNTRY_CURRENCIES.find((country) => country.code === 'NG')!;

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
  currency?: string;
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
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const selectedOpt = options.find(o => getOptionId(o) === value);
  const filteredOptions = options.filter((opt) => {
    const haystack = `${opt.name} ${opt.id ?? ''} ${opt.code ?? ''} ${opt.currency ?? ''}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

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
          {options.length > 8 && (
            <div className="sticky top-0 bg-white p-2 border-b border-[#E3E8F4]">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 rounded-[8px] border border-[#E3E8F4] px-3 text-[13px] font-semibold text-[#040B37] outline-none focus:border-[#1C4ED1]"
              />
            </div>
          )}
          {filteredOptions.map(opt => {
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
          {filteredOptions.length === 0 && (
            <div className="px-4 py-3 text-[13px] font-semibold text-gray-400">
              No options found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PayoutSettingsProps {
  initialMethod?: string;
  initialDetails?: PayoutDetails;
  onSaveSuccess?: () => void;
}

type PayoutDetails = {
  payoutCountry?: string;
  preferredCurrency?: string;
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  accountNameVerified?: boolean;
  paystackRecipientCode?: string;
  cryptoNetwork?: string;
  cryptoAddress?: string;
  customMethodType?: string;
  customIdentifier?: string;
};

export const InstructorPayoutSettings: React.FC<PayoutSettingsProps> = ({
  initialMethod = '',
  initialDetails = {},
  onSaveSuccess,
}) => {
  const [countries, setCountries] = useState<CountryCurrency[]>(COUNTRY_CURRENCIES);
  const [payoutCountry, setPayoutCountry] = useState<string>(initialDetails.payoutCountry || 'NG');
  const [preferredCurrency, setPreferredCurrency] = useState<string>(
    initialDetails.preferredCurrency || getCountry(initialDetails.payoutCountry || 'NG').currency
  );
  const [method, setMethod] = useState<string>(initialMethod || '');
  const selectedCountry = countries.find((country) => country.code === payoutCountry) ?? getCountry(payoutCountry);
  const regionalBanks = LOCAL_BANK_RAILS[payoutCountry] ?? [];
  const [paystackBanks, setPaystackBanks] = useState<SelectOption[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [isResolvingAccount, setIsResolvingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState<boolean>(Boolean(initialDetails.accountNameVerified && initialDetails.paystackRecipientCode));
  const supportsLocalBank = regionalBanks.length > 0;

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

  const bankOptions = payoutCountry === 'NG'
    ? paystackBanks.length > 0 ? paystackBanks : regionalBanks
    : regionalBanks;

  useEffect(() => {
    let cancelled = false;

    const selectedCode = payoutCountry;
    const hasSavedCurrency = !!initialDetails.preferredCurrency;

    async function loadCountries() {
      try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=cca2,name,currencies');
        if (!response.ok) return;
        const data = await response.json();
        if (!Array.isArray(data)) return;

        const next = data
          .map((country: unknown) => {
            const record = country as {
              cca2?: unknown;
              name?: { common?: unknown };
              currencies?: Record<string, unknown>;
            };
            const currency = record.currencies ? Object.keys(record.currencies)[0] : null;
            const code = typeof record.cca2 === 'string' ? record.cca2 : null;
            const name = typeof record.name?.common === 'string' ? record.name.common : null;
            if (!code || !name || !currency) return null;
            return { code, name, currency };
          })
          .filter((country: CountryCurrency | null): country is CountryCurrency => country !== null)
          .sort((a, b) => a.name.localeCompare(b.name));

        if (!cancelled && next.length > 0) {
          setCountries(next);
          const selected = next.find((country) => country.code === selectedCode);
          if (selected && !hasSavedCurrency) {
            setPreferredCurrency(selected.currency);
          }
        }
      } catch {
        // Keep the built-in catalogue as a reliable fallback.
      }
    }

    loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (payoutCountry !== 'NG') {
      setPaystackBanks([]);
      return;
    }

    async function loadPaystackBanks() {
      setIsLoadingBanks(true);
      try {
        const response = await fetch('/api/payments/paystack/banks?country=nigeria');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load banks.');
        const banks = Array.isArray(data.banks)
          ? data.banks.map((bank: { code: string; name: string }) => ({
              code: bank.code,
              name: bank.name,
            }))
          : [];
        if (!cancelled) setPaystackBanks(banks);
      } catch {
        if (!cancelled) setPaystackBanks([]);
      } finally {
        if (!cancelled) setIsLoadingBanks(false);
      }
    }

    loadPaystackBanks();
    return () => {
      cancelled = true;
    };
  }, [payoutCountry]);

  useEffect(() => {
    setAccountVerified(false);
    if (payoutCountry !== 'NG' || !bankCode || !/^\d{10}$/.test(accountNumber)) {
      if (payoutCountry === 'NG') setAccountName('');
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setIsResolvingAccount(true);
      setSaveError('');
      try {
        const response = await fetch('/api/payments/paystack/resolve-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bankCode, accountNumber }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to resolve account.');
        if (!cancelled) {
          setAccountName(String(data.accountName ?? '').toUpperCase());
          setAccountVerified(true);
        }
      } catch (error) {
        if (!cancelled) {
          setAccountName('');
          setAccountVerified(false);
          setSaveError(error instanceof Error ? error.message : 'Unable to resolve account.');
        }
      } finally {
        if (!cancelled) setIsResolvingAccount(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [accountNumber, bankCode, payoutCountry]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess('');
    setSaveError('');

    let details: Record<string, string> = {};

    if (!method) {
      setSaveError('Please choose a preferred payment method.');
      setIsSaving(false);
      return;
    }

    if (method === 'BANK') {
      if (!bankOptions.length || !bankOptions.some((bank) => bank.code === bankCode)) {
        setSaveError('Local bank payouts are not available for this region yet. Choose another payout method.');
        setIsSaving(false);
        return;
      }
      if (!bankCode) {
        setSaveError('Please select a payout destination.');
        setIsSaving(false);
        return;
      }
      if (!accountNumber || accountNumber.length < 8) {
        setSaveError('Please enter a valid 10-digit account number.');
        setIsSaving(false);
        return;
      }
      if (payoutCountry === 'NG' && !accountVerified) {
        setSaveError('Please wait for Paystack to verify the account name before saving.');
        setIsSaving(false);
        return;
      }
      if (!accountName.trim()) {
        setSaveError('We could not determine the account name. Please check the bank and account number.');
        setIsSaving(false);
        return;
      }
      const selectedBankName = bankOptions.find(b => b.code === bankCode)?.name || '';
      details = {
        payoutCountry,
        preferredCurrency,
        bankCode,
        bankName: selectedBankName,
        accountNumber,
        accountName: accountName.trim().toUpperCase(),
        accountNameVerified: accountVerified ? 'true' : 'false',
      };
    } else if (method === 'CRYPTO') {
      if (!cryptoAddress.trim()) {
        setSaveError('Please enter a valid wallet address.');
        setIsSaving(false);
        return;
      }
      details = {
        payoutCountry,
        preferredCurrency,
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
        payoutCountry,
        preferredCurrency,
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
    } catch {
      setSaveError('Failed to save payout settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedBank = bankOptions.find(b => b.code === bankCode);
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
            Payout Region
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label="Country / Region"
              value={payoutCountry}
              options={countries.map((country) => ({
                id: country.code,
                name: country.name,
                currency: country.currency,
              }))}
              onChange={(value) => {
                const country = countries.find((item) => item.code === value) ?? getCountry(value);
                setPayoutCountry(value);
                setPreferredCurrency(country.currency);
                setBankCode('');
                setAccountNumber('');
                setAccountName('');
                setAccountVerified(false);
                if (!LOCAL_BANK_RAILS[value]?.length && method === 'BANK') {
                  setMethod('');
                }
              }}
              placeholder="-- Choose region --"
              getOptionId={(o) => o.id!}
              renderOption={(o) => (
                <span className="flex items-center justify-between gap-3 w-full">
                  <span>{o.name}</span>
                  <span className="text-[11px] font-black text-[#1C4ED1]">{o.currency}</span>
                </span>
              )}
              renderSelected={(o) => o ? `${o.name} (${o.currency})` : undefined}
            />

            <div>
              <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                Default Course Currency
              </label>
              <div className="h-[48px] rounded-[10px] border border-[#E3E8F4] bg-[#F8FAFF] px-4 flex items-center justify-between gap-3">
                <span className="text-[14px] font-bold text-[#040B37]">{preferredCurrency}</span>
                <span className="text-[12px] font-semibold text-gray-400">Based on payout region</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-[12px] font-medium text-gray-400">
            New course pricing proposals will use this currency by default.
          </p>
        </div>

        <div>
          <label className="text-[13px] font-bold text-gray-500 uppercase tracking-wider block mb-3">
            Preferred Payment Method
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => supportsLocalBank && setMethod('BANK')}
              disabled={!supportsLocalBank}
              className={`flex items-center gap-3 p-4 rounded-[10px] border transition-all text-left outline-none ${
                !supportsLocalBank
                  ? 'border-[#E3E8F4] bg-[#F8FAFF] text-gray-300 cursor-not-allowed opacity-70'
                  : method === 'BANK'
                    ? 'border-[#1C4ED1] bg-[#1C4ED1]/5 text-[#1C4ED1] cursor-pointer'
                    : 'border-[#E3E8F4] bg-white text-gray-600 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <Building2 size={20} className={method === 'BANK' && supportsLocalBank ? 'text-[#1C4ED1]' : 'text-gray-400'} />
              <div>
                <p className="font-bold text-[14px]">Local Bank</p>
                <p className="text-[11px] font-medium text-gray-400 mt-0.5">
                  {supportsLocalBank ? `${selectedCountry.name} transfers` : 'Not available yet'}
                </p>
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
          {!method && (
            <p className="mt-2 text-[12px] font-medium text-gray-400">
              Choose a payout method to reveal the required account details.
            </p>
          )}
        </div>

        {/* Dynamic Forms */}
        <div className="pt-4 border-t border-[#E3E8F4] space-y-4">
          {method === 'BANK' && (
            <div className="space-y-4">
              {/* Info banner */}
              <div className="bg-[#F4F6FB] border border-[#E3E8F4] rounded-[10px] p-3.5 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-[#1C4ED1] mt-0.5 shrink-0" />
                <p className="text-[12px] font-semibold text-[#4B5563] leading-relaxed">
                  Enter your payout details exactly as they appear on your bank or mobile money records. We will verify before processing any payouts.
                </p>
              </div>

              {bankOptions.length > 0 ? (
                <CustomSelect
                  label={isLoadingBanks ? "Loading Paystack banks..." : "Select Bank"}
                  value={bankCode}
                  options={bankOptions}
                  onChange={(value) => {
                    setBankCode(value);
                    setAccountName('');
                    setAccountVerified(false);
                  }}
                  placeholder="-- Choose payout destination --"
                  getOptionId={(o) => o.code!}
                  renderOption={(o) => o.name}
                />
              ) : (
                <div className="bg-amber-50 border border-amber-100 rounded-[10px] p-3.5 flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-[12px] font-semibold text-amber-800 leading-relaxed">
                    Local bank payouts are not configured for {selectedCountry.name} yet. Use Other Channels while we expand regional banking support.
                  </p>
                </div>
              )}

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={accountNumber}
                  onChange={(e) => {
                    setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10));
                    setAccountName('');
                    setAccountVerified(false);
                  }}
                  placeholder="Enter 10-digit account number"
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all"
                />
                {isResolvingAccount && (
                  <p className="mt-1.5 flex items-center gap-2 text-[12px] font-semibold text-[#1C4ED1]">
                    <Loader2 size={13} className="animate-spin" /> Resolving account name with Paystack...
                  </p>
                )}
              </div>

              <div>
                <label className="text-[13px] font-extrabold text-[#4B5563] block mb-1.5">
                  Account Name <span className="text-[11px] font-medium text-gray-400">(verified by Paystack)</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  readOnly={payoutCountry === 'NG'}
                  onChange={(e) => {
                    setAccountName(e.target.value);
                    setAccountVerified(false);
                  }}
                  placeholder={payoutCountry === 'NG' ? 'Account name appears after verification' : 'e.g. JOHN DOE'}
                  className="w-full px-4 py-3 rounded-[10px] border border-[#E3E8F4] text-[14px] font-semibold text-[#040B37] placeholder-gray-400 focus:outline-none focus:border-[#1C4ED1] bg-white transition-all uppercase read-only:bg-[#F8FAFF]"
                />
                {accountVerified && (
                  <p className="mt-1.5 flex items-center gap-2 text-[12px] font-semibold text-emerald-700">
                    <CheckCircle2 size={13} /> Account verified and ready for automatic Paystack payouts.
                  </p>
                )}
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
