'use client';

import React from 'react';
import Image from 'next/image';

interface BillingRecord {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
  invoiceUrl: string;
}

const records: BillingRecord[] = [
  { id: '1', date: 'Apr 1, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid', invoiceUrl: '#' },
  { id: '2', date: 'Mar 1, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid', invoiceUrl: '#' },
  { id: '3', date: 'Feb 1, 2026', description: 'Pro Plan — Monthly', amount: '$29.00', status: 'Paid', invoiceUrl: '#' },
];

export const BillingHistory = () => {
  return (
    <div className="bg-white border border-[#E3E8F4] rounded-[16px] overflow-hidden shadow-sm">
      <div className="bg-white border-b border-[#E3E8F4] px-6 py-5 md:px-8">
        <h3 className="text-[16px] md:text-[18px] font-bold text-[#040B37] tracking-tight">
          Billing History
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F4F6FB] border-b border-[#E3E8F4]">
              <th className="px-6 md:px-8 py-4 text-[14px] font-bold text-[#040B37] uppercase tracking-wider">Date</th>
              <th className="px-6 md:px-8 py-4 text-[14px] font-bold text-[#040B37] uppercase tracking-wider">Description</th>
              <th className="px-6 md:px-8 py-4 text-[14px] font-bold text-[#040B37] uppercase tracking-wider">Amount</th>
              <th className="px-6 md:px-8 py-4 text-[14px] font-bold text-[#040B37] uppercase tracking-wider">Status</th>
              <th className="px-6 md:px-8 py-4 text-[14px] font-bold text-[#040B37] uppercase tracking-wider text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E3E8F4]">
            {records.map((record) => (
              <tr key={record.id} className="hover:bg-[#F4F6FB]/30 transition-colors">
                <td className="px-6 md:px-8 py-5 text-[15px] font-medium text-[#4B5563]">{record.date}</td>
                <td className="px-6 md:px-8 py-5 text-[15px] font-medium text-[#4B5563]">{record.description}</td>
                <td className="px-6 md:px-8 py-5 text-[15px] font-medium text-[#4B5563]">{record.amount}</td>
                <td className="px-6 md:px-8 py-5">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-bold ${
                    record.status === 'Paid' 
                      ? 'bg-[#1CB247]/10 text-[#1CB247]' 
                      : record.status === 'Pending' 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-red-100 text-red-700'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 md:px-8 py-5 text-right">
                  <button className="text-[#1C4ED1] font-bold text-[14px] hover:underline transition-all cursor-pointer">
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
