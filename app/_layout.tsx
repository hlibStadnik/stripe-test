import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { StripeProvider } from "@stripe/stripe-react-native";
import { fetchPublishableKey } from "@/utils/stripe";
import { useEffect, useState } from "react";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  useEffect(() => {
    const initStripe = async () => {
      const key = await fetchPublishableKey();
      setPublishableKey(key);
    };
    initStripe();
  }, []);

  if (!publishableKey) {
    return null; // or a loading screen
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StripeProvider
        publishableKey={publishableKey}
        merchantIdentifier="merchant.identifier" // required for Apple Pay
        urlScheme="your-url-scheme" // required for 3D Secure and bank redirects
      >
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{ presentation: "modal", title: "Modal" }}
          />
        </Stack>
        <StatusBar style="auto" />
      </StripeProvider>
    </ThemeProvider>
  );
}
