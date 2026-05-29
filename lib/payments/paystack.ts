import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

export type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: PaystackTransaction;
};

export type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel?: string;
  paid_at?: string | null;
  created_at?: string;
  gateway_response?: string;
  customer?: {
    email?: string;
  };
  metadata?: Record<string, unknown>;
};

export type PaystackTransferResponse = {
  status: boolean;
  message: string;
  data?: {
    transfer_code: string;
    reference: string;
    status: string;
  };
};

export type PaystackTransferRecipientResponse = {
  status: boolean;
  message: string;
  data?: {
    recipient_code: string;
    type: string;
    name: string;
  };
};

export type PaystackBank = {
  name: string;
  slug: string;
  code: string;
  longcode?: string;
  country?: string;
  currency?: string;
  type?: string;
};

export type PaystackAccountResolveResponse = {
  status: boolean;
  message: string;
  data?: {
    account_number: string;
    account_name: string;
    bank_id?: number;
  };
};

function getSecretKey() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured.");
  return key;
}

async function paystackFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message ?? "Paystack request failed.");
  }
  return data as T;
}

export function amountToPaystackMinorUnit(amount: number) {
  return Math.round(amount * 100);
}

export function amountFromPaystackMinorUnit(amount: number) {
  return amount / 100;
}

export function verifyPaystackSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const hash = crypto
    .createHmac("sha512", getSecretKey())
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

export async function initializePaystackTransaction(input: {
  email: string;
  amount: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return paystackFetch<PaystackInitializeResponse>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: amountToPaystackMinorUnit(input.amount),
      currency: input.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export async function verifyPaystackTransaction(reference: string) {
  return paystackFetch<PaystackVerifyResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export async function createPaystackTransferRecipient(input: {
  name: string;
  accountNumber: string;
  bankCode: string;
  currency?: string;
}) {
  return paystackFetch<PaystackTransferRecipientResponse>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({
      type: "nuban",
      name: input.name,
      account_number: input.accountNumber,
      bank_code: input.bankCode,
      currency: input.currency ?? "NGN",
    }),
  });
}

export async function listPaystackBanks(country = "nigeria") {
  return paystackFetch<{ status: boolean; message: string; data: PaystackBank[] }>(
    `/bank?country=${encodeURIComponent(country)}`
  );
}

export async function resolvePaystackAccount(input: {
  accountNumber: string;
  bankCode: string;
}) {
  return paystackFetch<PaystackAccountResolveResponse>(
    `/bank/resolve?account_number=${encodeURIComponent(input.accountNumber)}&bank_code=${encodeURIComponent(input.bankCode)}`
  );
}

export async function initiatePaystackTransfer(input: {
  amount: number;
  currency: string;
  recipientCode: string;
  reason: string;
  reference: string;
}) {
  return paystackFetch<PaystackTransferResponse>("/transfer", {
    method: "POST",
    body: JSON.stringify({
      source: "balance",
      amount: amountToPaystackMinorUnit(input.amount),
      currency: input.currency,
      recipient: input.recipientCode,
      reason: input.reason,
      reference: input.reference,
    }),
  });
}
