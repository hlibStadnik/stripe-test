import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import {
  IntentConfiguration,
  EmbeddedPaymentElementConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  RowStyle,
  useEmbeddedPaymentElement,
} from "@stripe/stripe-react-native";
import { useState, useCallback, useEffect } from "react";
import { API_URL } from "@/utils/config";
import { createCustomerSession } from "@/utils/stripe";
// import { useDiscount } from "@/hooks/use-discount";
// const { applyDiscountCode } = useDiscount(intentConfig, update);

const moneyAmount = 99; // $99 is cents

export default function HomeScreen() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | null>(null);
  const [intentConfig, setIntentConfig] = useState<IntentConfiguration | null>(
    null
  );
  const [elementConfig, setElementConfig] =
    useState<EmbeddedPaymentElementConfiguration | null>(null);

  const handleConfirm = useCallback(
    async (
      confirmationToken: any,
      shouldSavePaymentMethod: boolean,
      intentCreationCallback: (params: IntentCreationCallbackParams) => void
    ) => {
      console.log("handleConfirm called with token:", confirmationToken.id);
      console.log("shouldSavePaymentMethod:", shouldSavePaymentMethod);
      console.log(
        "intentCreationCallback type:",
        typeof intentCreationCallback
      );

      try {
        // Make a request to your own server and receive a client secret or an error.
        const response = await fetch(`${API_URL}/create-payment-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmation_token_id: confirmationToken.id,
            amount: moneyAmount,
            currency: "usd",
          }),
        });

        console.log("Server response status:", response.status);

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Server error:", errorData);
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Server response data:", data);

        if (!data.clientSecret) {
          throw new Error("No client secret returned from server");
        }

        // Call the `intentCreationCallback` with the client secret.
        console.log("Calling callback with clientSecret");
        intentCreationCallback({ clientSecret: data.clientSecret });
      } catch (error: any) {
        console.error("Error in handleConfirm:", error);
        // Call the `intentCreationCallback` with the error.
        intentCreationCallback({
          error: {
            code: "Failed",
            message: error.message || "Unknown error occurred",
            localizedMessage: error.message || "Unknown error occurred",
          } as IntentCreationError,
        });
      }
    },
    []
  );

  const initialize = useCallback(() => {
    const newIntentConfig: IntentConfiguration = {
      mode: {
        amount: moneyAmount,
        currencyCode: "USD",
      },
      confirmHandler: handleConfirm,
    };

    const newElementConfig: EmbeddedPaymentElementConfiguration = {
      merchantDisplayName: "Nellis Auction",
      customerId: customerId!,
      customerSessionClientSecret: customerSessionClientSecret!,
      returnURL: "com.nellis.stripe://stripe-redirect",
      appearance: {
        embeddedPaymentElement: {
          row: {
            style: RowStyle.Flat,
          },
        },
      },
      googlePay: {
        testEnv: true,
        merchantCountryCode: "US",
        currencyCode: "USD",
      },
    };

    setIntentConfig(newIntentConfig);
    setElementConfig(newElementConfig);
  }, [handleConfirm, customerId, customerSessionClientSecret]);

  useEffect(() => {
    const setupCustomer = async () => {
      const session = await createCustomerSession();
      if (session) {
        setCustomerId(session.customer);
        setCustomerSessionClientSecret(session.customerSessionClientSecret);
      }
    };
    setupCustomer();
  }, []);

  useEffect(() => {
    if (customerId && customerSessionClientSecret) {
      initialize();
    }
  }, [initialize, customerId, customerSessionClientSecret]);

  const {
    embeddedPaymentElementView,
    paymentOption,
    confirm,
    update,
    clearPaymentOption,
    loadingError,
    // isLoaded,
  } = useEmbeddedPaymentElement(
    intentConfig as IntentConfiguration,
    elementConfig as EmbeddedPaymentElementConfiguration
  );

  const handleSubmit = useCallback(async () => {
    setIsProcessing(true);

    try {
      const result = await confirm();

      switch (result.status) {
        case "completed":
          Alert.alert("Success", "Payment was completed successfully!");
          break;
        case "failed":
          Alert.alert("Error", `Payment failed: ${result.error.message}`);
          break;
        case "canceled":
          console.log("Payment was canceled by the user");
          break;
      }
    } catch (error) {
      // Handle any unexpected errors
      console.error("Unexpected error during confirmation:", error);
      Alert.alert("Error", "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  }, [confirm]);

  if (
    !intentConfig ||
    !elementConfig ||
    !customerId ||
    !customerSessionClientSecret
  ) {
    return (
      <ParallaxScrollView
        headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
        headerImage={
          <Image
            source={require("@/assets/images/partial-react-logo.png")}
            style={styles.reactLogo}
          />
        }
      >
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </ParallaxScrollView>
    );
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      <View>
        {/* Handle loading errors through the loadingError property */}
        {loadingError && (
          <View>
            <Text>
              Failed to load payment form:{" "}
              {loadingError.message || String(loadingError)}
            </Text>
          </View>
        )}
        {/* Keep the view in the render tree for Android, control visibility with opacity */}
        <View>{embeddedPaymentElementView}</View>
        {/* Show loading indicator while the view is loading */}
        {!loadingError && (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        )}
      </View>
      {/* <View>
        <Button
          title="Apply Discount Code"
          onPress={() => applyDiscountCode("123456")}
        />
      </View> */}
      <View>
        {/* Other UI elements */}

        <Button
          title="Pay"
          onPress={handleSubmit}
          disabled={isProcessing || !paymentOption}
        />

        {isProcessing && <ActivityIndicator size="large" />}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
