import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import "react-native-reanimated";

import { fetchPublishableKey } from "@/utils/stripeApi";
import { StripeProvider } from "@stripe/stripe-react-native";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";

export default function RootLayout() {
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      const key = await fetchPublishableKey();
      setPublishableKey(key);
    };
    initStripe();
  }, []);

  if (!publishableKey) {
    return <Text>Loading publishableKey...</Text>;
  }

  return (
    <StripeProvider
      publishableKey={publishableKey}
      merchantIdentifier="merchant.identifier"
      urlScheme="your-url-scheme"
    >
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </StripeProvider>
  );
}
