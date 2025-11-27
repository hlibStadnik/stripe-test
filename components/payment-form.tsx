import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
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
} from "@stripe/stripe-react-native";
import { useState, useCallback, useEffect } from "react";
import { API_URL } from "@/utils/config";

interface PaymentFormProps {
  amount: number;
  customerId: string;
  customerSessionClientSecret: string;
  storeCredit?: number;
  onConfirmReady?: (confirmFn: () => Promise<any>) => void;
  isProcessingExternal?: boolean;
  isSplittingPayment?: boolean;
}

export function PaymentForm({
  amount,
  customerId,
  customerSessionClientSecret,
  storeCredit = 0,
  onConfirmReady,
  isProcessingExternal = false,
  isSplittingPayment = false,
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("card");
  const [appliedCredit, setAppliedCredit] = useState(0);
  const [finalAmount, setFinalAmount] = useState(amount);

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
            amount: finalAmount,
            currency: "usd",
            setup_future_usage: shouldSavePaymentMethod
              ? "off_session"
              : undefined,
            store_credit_applied: appliedCredit,
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
            `Payment completed with store credit! $${(
              appliedCredit / 100
            ).toFixed(2)} used.`
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
    [finalAmount, appliedCredit]
  );
  const [intentConfig, setIntentConfig] = useState<IntentConfiguration | null>({
    confirmHandler: handleConfirm,
    mode: { amount: finalAmount, currencyCode: "USD" },
  });

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
    if (onConfirmReady && confirm) {
      // Wrap confirm to ensure it's called correctly
      const confirmWrapper = async () => {
        return await confirm();
      };
      onConfirmReady(confirmWrapper);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Custom Store Credit Option */}
      {storeCredit > 0 && (
        <TouchableOpacity
          style={[
            selectedMethod === "storecredit" && styles.methodCardSelected,
            {
              paddingVertical: 25,
            },
          ]}
          onPress={() => clearPaymentOption()}
          //   onPress={() => setSelectedMethod("storecredit")}
        >
          <View style={styles.methodRow}>
            <View style={styles.radioOuter}>
              {selectedMethod === "storecredit" && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Image
              source={require("@/assets/images/credit.png")}
              resizeMode="contain"
              style={{ width: 20, height: 20, marginRight: 8, marginLeft: 4 }}
            />
            <Text style={styles.methodLabel}>Store credit</Text>
          </View>
        </TouchableOpacity>
      )}

      {isProcessingExternal && <ActivityIndicator size="large" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
});
