import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";

import {
  IntentConfiguration,
  EmbeddedPaymentElementConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  useEmbeddedPaymentElement,
  RowStyle,
  BillingDetails,
  CustomPaymentMethod,
  CustomPaymentMethodResult,
  EmbeddedPaymentElementResult,
} from "@stripe/stripe-react-native";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { API_URL } from "@/utils/config";

interface PaymentFormProps {
  amount: number;
  customerId: string;
  otherPaymentType?: string;
  customerSessionClientSecret: string;
  storeCredit?: number;
  setConfirmCallback?: (confirmFn: any) => void;
  isProcessingExternal?: boolean;
  isSplittingPayment?: boolean;
  total?: number;
}

export function PaymentForm({
  amount,
  customerId,
  otherPaymentType,
  customerSessionClientSecret,
  storeCredit = 0,
  setConfirmCallback,
  isProcessingExternal = false,
  isSplittingPayment = false,
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
      googlePay: isSplittingPayment
        ? undefined
        : {
            testEnv: true,
            merchantCountryCode: "US",
            currencyCode: "USD",
          },
      applePay: isSplittingPayment
        ? undefined
        : {
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
        const response = await fetch(`${API_URL}/create-intent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            confirmation_token_id: confirmationToken.id,
            amount,
            currency: "usd",
            setup_future_usage: shouldSavePaymentMethod
              ? "off_session"
              : undefined,
            store_credit_applied: storeCredit,
            isSplittingPayment,
            total,
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

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
    paymentOption,
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
  methodCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingVertical: 25,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    marginTop: 12,
  },
  methodCardSelected: {
    borderColor: "#4285f4",
  },
  methodRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4285f4",
  },
  methodLabel: {
    fontSize: 16,
    color: "#000",
  },
  storeCreditBadge: {
    backgroundColor: "#e53935",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  storeCreditText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  storeCreditInputContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputLabel: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    color: "#333",
    marginRight: 4,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 18,
    minWidth: 100,
    color: "#000",
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
  },
  calculationLabel: {
    fontSize: 14,
    color: "#666",
  },
  calculationValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  creditApplied: {
    color: "#e53935",
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#d0d0d0",
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 16,
    color: "#4285f4",
    fontWeight: "700",
  },
});
