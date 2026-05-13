'use client';

import React from 'react';
import Image from 'next/image';
import { CreditCard, Plus, Trash2 } from 'lucide-react';

interface CardData {
  id: string;
  type: 'Visa' | 'Mastercard';
  last4: string;
  expiry: string;
  isDefault?: boolean;
}

const paymentCards: CardData[] = [
  { id: '1', type: 'Mastercard', last4: '1234', expiry: '12/26', isDefault: true },
  { id: '2', type: 'Visa', last4: '5678', expiry: '08/25' },
];

export const PaymentMethods = () => {
  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] overflow-hidden shadow-sm">
      <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8 flex items-center justify-between">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight">
          Payment Methods
        </h3>
        <button className="flex items-center gap-2 text-[#1C4ED1] text-[14px] font-bold hover:bg-[#1C4ED1]/5 px-3 py-1.5 rounded-[8px] transition-all cursor-pointer">
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div className="p-6 md:p-8 space-y-4">
        {paymentCards.map((card) => (
          <div 
            key={card.id} 
            className="flex items-center justify-between p-4 border border-[#E3E8F4] rounded-[12px] hover:border-[#1C4ED1]/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-[#F4F6FB] rounded-[4px] flex items-center justify-center border border-[#E3E8F4]">
                {card.type === 'Mastercard' ? (
                  <div className="flex -space-x-2">
                    <div className="w-4 h-4 rounded-full bg-[#EB001B] opacity-80" />
                    <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-80" />
                  </div>
                ) : (
                  <span className="text-[#1A1F71] font-bold italic text-[12px]">VISA</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-[#040B37]">
                    •••• •••• •••• {card.last4}
                  </p>
                  {card.isDefault && (
                    <span className="text-[10px] font-bold text-[#1C4ED1] bg-[#1C4ED1]/5 px-1.5 py-0.5 rounded uppercase">Default</span>
                  )}
                </div>
                <p className="text-[12px] font-medium text-[#9CA3AF]">
                  Expires {card.expiry}
                </p>
              </div>
            </div>
            
            <button className="p-2 text-[#9CA3AF] hover:text-[#FF383C] hover:bg-[#FF383C]/5 rounded-[8px] transition-all cursor-pointer opacity-0 group-hover:opacity-100">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
