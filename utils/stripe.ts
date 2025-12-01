import { Alert } from "react-native";
import { API_URL } from "@/utils/config";

export async function fetchPublishableKey(
  paymentMethod?: string
): Promise<string | null> {
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

export interface EphemeralKeyResponse {
  ephemeralKey: string;
}

export async function createEphemeralKey(
  customerId: string
): Promise<EphemeralKeyResponse | null> {
  try {
    const response = await fetch(`${API_URL}/create-ephemeral-key`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customerId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create ephemeral key");
    }

    const data = await response.json();
    return data;
  } catch (e) {
    console.warn("Unable to create ephemeral key. Is your server running?");
    Alert.alert(
      "Error",
      "Unable to create ephemeral key. Is your server running?"
    );
    return null;
  }
}

export interface SetupIntentResponse {
  clientSecret: string;
}

export async function createSetupIntent(
  customerId: string
): Promise<SetupIntentResponse | null> {
  try {
    const response = await fetch(`${API_URL}/create-setup-intent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerId: customerId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create setup intent");
    }

    const data = await response.json();
    return data;
  } catch (e) {
    console.warn("Unable to create setup intent. Is your server running?");
    Alert.alert(
      "Error",
      "Unable to create setup intent. Is your server running?"
    );
    return null;
  }
}

export interface CreatePaymentIntentParams {
  confirmation_token_id: string;
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
