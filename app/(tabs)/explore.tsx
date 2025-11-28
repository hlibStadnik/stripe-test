import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Fonts } from "@/constants/theme";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { CustomerSheet } from "@stripe/stripe-react-native";
import { API_URL } from "@/utils/config";
import { useState } from "react";

export default function TabTwoScreen() {
  const { customerId, customerSessionClientSecret } = useCustomerSession();
  const [isInitializingWallet, setIsInitializingWallet] = useState(false);

  const openWallet = async () => {
    if (!customerId) {
      Alert.alert("Error", "Customer ID not initialized");
      return;
    }

    setIsInitializingWallet(true);
    try {
      // Create ephemeral key and setup intent
      const [ephemeralKeyResponse, setupIntentResponse] = await Promise.all([
        fetch(`${API_URL}/create-ephemeral-key`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: customerId,
          }),
        }),
        fetch(`${API_URL}/create-setup-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customerId: customerId,
          }),
        }),
      ]);

      if (!ephemeralKeyResponse.ok || !setupIntentResponse.ok) {
        throw new Error("Failed to initialize wallet");
      }

      const ephemeralKeyData = await ephemeralKeyResponse.json();
      const setupIntentData = await setupIntentResponse.json();

      // Initialize CustomerSheet
      const { error: initError } = await CustomerSheet.initialize({
        customerId: customerId,
        customerEphemeralKeySecret: ephemeralKeyData.ephemeralKey,
        setupIntentClientSecret: setupIntentData.clientSecret,
        merchantDisplayName: "Nellis Auction",
        headerTextForSelectionScreen: "Manage your payment methods",
        returnURL: "com.nellis.stripe://stripe-redirect",
        appearance: {
          shapes: {
            borderRadius: 12,
            borderWidth: 2,
          },
          primaryButton: {
            shapes: {
              borderRadius: 18,
            },
            colors: {
              text: "#ffffff",
              border: "#4285f4",
            },
          },
        },
      });

      if (initError) {
        Alert.alert(
          "Error",
          `Failed to initialize wallet: ${initError.message}`
        );
        setIsInitializingWallet(false);
        return;
      }

      // Present the CustomerSheet
      const { error: presentError, paymentOption } =
        await CustomerSheet.present();

      if (presentError) {
        if (presentError.code !== "Canceled") {
          Alert.alert(
            "Error",
            `Failed to open wallet: ${presentError.message}`
          );
        }
      } else if (paymentOption) {
        Alert.alert("Success", "Payment method updated!");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to open wallet");
    } finally {
      setIsInitializingWallet(false);
    }
  };

  if (!customerId || !customerSessionClientSecret) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
        headerImage={
          <IconSymbol
            size={310}
            color="#808080"
            name="chevron.left.forwardslash.chevron.right"
            style={styles.headerImage}
          />
        }
      >
        <ThemedView style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={{
              fontFamily: Fonts.rounded,
            }}
          >
            Explore
          </ThemedText>
        </ThemedView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading customer session...</Text>
        </View>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}
        >
          Explore
        </ThemedText>
      </ThemedView>
      <View style={styles.contentContainer}>
        <Text style={styles.infoText}>Manage your saved payment methods</Text>

        <TouchableOpacity
          style={styles.walletButton}
          onPress={openWallet}
          disabled={isInitializingWallet}
        >
          {isInitializingWallet ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <IconSymbol name="creditcard" size={24} color="#ffffff" />
              <Text style={styles.walletButtonText}>Open Wallet</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
  titleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  loadingContainer: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  contentContainer: {
    padding: 16,
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 24,
  },
  walletButton: {
    backgroundColor: "#4285f4",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  walletButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
