import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { createPaymentIntent } from "@/utils/stripe";
import {
  EmbeddedPaymentElementConfiguration,
  IntentConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  RowStyle,
  useEmbeddedPaymentElement,
} from "@stripe/stripe-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";

interface PaymentFormProps {
  amount: number;
  customerId: string;
  otherPaymentType?: string;
  customerSessionClientSecret: string;
  storeCredit?: number;
  setConfirmCallback?: (confirmFn: any) => void;
  isProcessingExternal?: boolean;
  total?: number;
}

export function PaymentForm({
  amount,
  customerId,
  customerSessionClientSecret,
  storeCredit = 0,
  setConfirmCallback,
  isProcessingExternal = false,
  total = 0,
}: PaymentFormProps) {
  const [elementConfig, setElementConfig] =
    useState<EmbeddedPaymentElementConfiguration | null>({
      merchantDisplayName: "Nellis Auction",
      customerId: customerId,
      customerSessionClientSecret: customerSessionClientSecret,
      returnURL: "com.nellis.stripe://stripe-redirect",
      appearance: {
        embeddedPaymentElement: {
          row: {
            style: RowStyle.FlatWithRadio,
            additionalInsets: 10,
            flat: {
              separatorThickness: 0,
              topSeparatorEnabled: false,
            },
            floating: {
              spacing: 32,
            },
          },
        },
        shapes: {
          borderRadius: 12,
          borderWidth: 2,
        },
        primaryButton: {
          shapes: {
            borderRadius: 18,
          },
          colors: {
            // background: "#f00",
            text: "#ffffff",
            border: "#4285f4",
          },
        },
      },
      googlePay: {
        testEnv: true,
        merchantCountryCode: "US",
        currencyCode: "USD",
      },
      applePay: {
        merchantCountryCode: "US",
      },
    });

  const handleConfirm = useCallback(
    async (
      confirmationToken: any,
      shouldSavePaymentMethod: boolean,
      intentCreationCallback: (params: IntentCreationCallbackParams) => void
    ) => {
      try {
        const data = await createPaymentIntent({
          paymentMethodId: confirmationToken.id,
          amount,
          currency: "usd",
          setup_future_usage: shouldSavePaymentMethod
            ? "off_session"
            : undefined,
          storeCreditApplied: storeCredit,
          total,
        });

        if (data.paidWithStoreCredit) {
          Alert.alert(
            "Success",
            `Payment completed with store credit! $${(amount / 100).toFixed(
              2
            )} used.`
          );
          clearPaymentOption();
          return;
        }

        if (!data.clientSecret) {
          throw new Error("No client secret returned from server");
        }

        console.log(`Calling callback with clientSecret`);
        intentCreationCallback({ clientSecret: data.clientSecret });
      } catch (error: any) {
        console.error(`Error in handleConfirm:`, error);
        intentCreationCallback({
          error: {
            code: "Failed",
            message: error.message || "Unknown error occurred",
            localizedMessage: error.message || "Unknown error occurred",
          } as IntentCreationError,
        });
      }
    },
    [amount, storeCredit]
  );

  const intentConfig = useMemo(
    () => ({
      confirmHandler: handleConfirm,
      mode: { amount: amount, currencyCode: "USD" },
    }),
    [handleConfirm, amount]
  );

  const {
    embeddedPaymentElementView,
    confirm,
    loadingError,
    clearPaymentOption,
  } = useEmbeddedPaymentElement(
    intentConfig as IntentConfiguration,
    elementConfig as EmbeddedPaymentElementConfiguration
  );

  useEffect(() => {
    setConfirmCallback?.(() => confirm);
  }, [confirm]);

  if (!intentConfig || !elementConfig) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Stripe Payment Element with custom styling */}
      <View>
        {loadingError && (
          <View>
            <Text style={styles.errorText}>
              Failed to load payment form:{" "}
              {loadingError.message || String(loadingError)}
            </Text>
          </View>
        )}
        <View>{embeddedPaymentElementView}</View>
        {loadingError && (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        )}
      </View>

      {isProcessingExternal && <ActivityIndicator size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom: 24,
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
});
