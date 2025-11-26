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
