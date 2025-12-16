import { Alert } from "react-native";
import { API_URL } from "@/config";

export async function fetchPublishableKey(): Promise<string | null> {
  try {
    const response = await fetch(`${API_URL}/config`);

    const { key } = await response.json();

    return key;
  } catch (e) {
    console.warn("Unable to fetch publishable key. Is your server running?");
    Alert.alert(
      "Error",
      "Unable to fetch publishable key. Is your server running?"
    );
    return null;
  }
}

export interface CustomerSession {
  customerSessionClientSecret: string;
  customer: string;
}

export async function createCustomerSession(): Promise<CustomerSession | null> {
  try {
    const response = await fetch(`${API_URL}/payment-sheet`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to create customer session");
    }

    const data = await response.json();
    return {
      customerSessionClientSecret: data.customerSessionClientSecret,
      customer: data.customer,
    };
  } catch (e) {
    console.warn("Unable to create customer session. Is your server running?");
    Alert.alert(
      "Error",
      "Unable to create customer session. Is your server running?"
    );
    return null;
  }
}

export interface CreatePaymentIntentParams {
  paymentMethodId: string;
  amount: number;
  currency: string;
  setup_future_usage?: string;
  storeCreditApplied?: number;
  total?: number;
}

export interface PaymentIntentResponse {
  clientSecret?: string;
  paidWithStoreCredit?: boolean;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> {
  const response = await fetch(`${API_URL}/create-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Server error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}
