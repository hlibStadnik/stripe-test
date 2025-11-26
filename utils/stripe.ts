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
