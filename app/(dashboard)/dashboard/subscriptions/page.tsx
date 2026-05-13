'use client';

import React from 'react';
import { PlanCard } from '@/components/dashboard/subscriptions/PlanCard';
import { BillingHistory } from '@/components/dashboard/subscriptions/BillingHistory';
import { PaymentMethods } from '@/components/dashboard/subscriptions/PaymentMethods';
import { NextBilling } from '@/components/dashboard/subscriptions/NextBilling';
import { ActivePlanCard } from '@/components/dashboard/subscriptions/ActivePlanCard';

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for exploring the platform and starting your learning journey.",
    features: [
      "Access to free courses",
      "Community forum access",
      "Standard support",
      "Limited resource downloads"
    ],
    buttonText: "Downgrade",
    isCurrent: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "Full access to all courses, live sessions, and premium resources.",
    features: [
      "Unlimited course access",
      "Live sessions & workshops",
      "Downloadable certificates",
      "Priority support",
      "Offline downloads"
    ],
    isActive: true,
    buttonText: "Current Plan",
    isCurrent: true
  },
  {
    name: "Team",
    price: "$79",
    period: "/month",
    description: "Best for organizations and teams looking to scale their learning.",
    features: [
      "Up to 10 seats included",
      "Custom learning paths",
      "Team analytics & reports",
      "Dedicated account manager",
      "Bulk enrollment"
    ],
    buttonText: "Contact Sales"
  }
];

export default function SubscriptionsPage() {
  return (
    <div className="p-6 md:p-10 space-y-8 md:space-y-12 max-w-[1600px] mx-auto font-jakarta pb-20">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-[24px] md:text-[32px] font-bold text-[#040B37] tracking-tight leading-tight">
          Subscriptions
        </h1>
        <p className="text-[#9CA3AF] text-[15px] md:text-[16px] font-medium tracking-tight">
          Manage your plan and billing
        </p>
      </div>

      {/* Active Plan Hero */}
      <ActivePlanCard />

      {/* Plans Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#040B37] tracking-tight">
          All Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <PlanCard key={plan.name} {...plan} />
          ))}
        </div>
      </div>

      {/* Grid Layout for Billing Info */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
        <div className="xl:col-span-2">
          <PaymentMethods />
        </div>
        <div className="xl:col-span-1">
          <NextBilling />
        </div>
      </div>

      {/* Billing History Section */}
      <div className="space-y-6 mt-8">
        <h2 className="text-[20px] md:text-[24px] font-bold text-[#040B37] tracking-tight">
          Billing History
        </h2>
        <BillingHistory />
      </div>
    </div>
  );
}
