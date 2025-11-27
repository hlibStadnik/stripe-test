import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  IntentConfiguration,
  EmbeddedPaymentElementConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  useEmbeddedPaymentElement,
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
}

export function PaymentForm({
  amount,
  customerId,
  customerSessionClientSecret,
  storeCredit = 0,
  onConfirmReady,
  isProcessingExternal = false,
}: PaymentFormProps) {
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
            style: "floating" as any,
          },
        },
      },
      googlePay: {
        testEnv: true,
        merchantCountryCode: "US",
        currencyCode: "USD",
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

  const applyStoreCredit = useCallback(() => {
    const creditToApply = Math.min(storeCredit, amount);
    setAppliedCredit(creditToApply);
    const newAmount = Math.max(amount - creditToApply, 0);
    setFinalAmount(newAmount);
    console.log(
      `[ Applied store credit:`,
      creditToApply,
      "New amount:",
      newAmount
    );
  }, [storeCredit, amount]);

  const initialize = useCallback(() => {
    const newIntentConfig: IntentConfiguration = {
      mode: {
        amount: finalAmount,
        currencyCode: "USD",
      },
      confirmHandler: handleConfirm,
    };

    const newElementConfig: EmbeddedPaymentElementConfiguration = {
      merchantDisplayName: "Nellis Auction",
      customerId: customerId,
      customerSessionClientSecret: customerSessionClientSecret,
      returnURL: "com.nellis.stripe://stripe-redirect",
      appearance: {
        embeddedPaymentElement: {
          row: {
            style: "floating" as any,
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
  }, [handleConfirm, customerId, customerSessionClientSecret, finalAmount]);

  useEffect(() => {
    if (customerId && customerSessionClientSecret) {
      setTimeout(() => {
        // initialize();
      }, 100);
    }
  }, [initialize, customerId, customerSessionClientSecret]);

  const { embeddedPaymentElementView, paymentOption, confirm, loadingError } =
    useEmbeddedPaymentElement(
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
      {/* Store Credit Section */}
      {/* {storeCredit > 0 && (
        <View style={styles.storeCreditContainer}>
          <Text style={styles.storeCreditTitle}>
            💰 Store Credit Available: ${(storeCredit / 100).toFixed(2)}
          </Text>
          <Text style={styles.amountText}>
            Amount: ${(amount / 100).toFixed(2)}
          </Text>
          {appliedCredit > 0 && (
            <>
              <Text style={styles.creditApplied}>
                ✅ Store Credit Applied: -${(appliedCredit / 100).toFixed(2)}
              </Text>
              <Text style={styles.finalAmount}>
                Amount to Pay: ${(finalAmount / 100).toFixed(2)}
              </Text>
            </>
          )}
          {appliedCredit === 0 && (
            <Button title="Apply Store Credit" onPress={applyStoreCredit} />
          )}
        </View>
      )} */}

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
    marginBottom: 24,
  },

  storeCreditContainer: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginBottom: 16,
  },
  storeCreditTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  amountText: {
    fontSize: 14,
    marginBottom: 8,
  },
  creditApplied: {
    fontSize: 14,
    color: "green",
    marginBottom: 4,
  },
  finalAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    marginBottom: 8,
  },
  buttonContainer: {
    marginTop: 16,
  },
});
