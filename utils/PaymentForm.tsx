import {
  ActivityIndicator,
  Button,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { createPaymentIntent } from "@/utils/stripeApi";
import {
  EmbeddedPaymentElementConfiguration,
  IntentConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  useEmbeddedPaymentElement,
} from "@stripe/stripe-react-native";
import { useEffect, useMemo } from "react";

interface PaymentFormProps {
  amount: number;
  customerId: string;
  otherPaymentType?: string;
  customerSessionClientSecret: string;
  storeCredit?: number;
  total?: number;
}

export function PaymentForm({
  amount,
  customerId,
  customerSessionClientSecret,
  storeCredit = 0,
  total = 0,
}: PaymentFormProps) {
  const elementConfig = useMemo<EmbeddedPaymentElementConfiguration | null>(
    () => ({
      merchantDisplayName: "Demo App",
      customerId: customerId,
      customerSessionClientSecret: customerSessionClientSecret,
      googlePay: {
        testEnv: true,
        merchantCountryCode: "US",
        currencyCode: "USD",
      },
      applePay: {
        merchantCountryCode: "US",
      },
    }),
    [customerId, customerSessionClientSecret]
  );

  const intentConfig = useMemo(
    () => ({
      confirmHandler: async (
        confirmationToken: any,
        shouldSavePaymentMethod: boolean,
        intentCreationCallback: (params: IntentCreationCallbackParams) => void
      ) => {
        try {
          const newAmount = amount - storeCredit;
          const data = await createPaymentIntent({
            paymentMethodId: confirmationToken.id,
            amount: newAmount,
            currency: "usd",
            setup_future_usage: shouldSavePaymentMethod
              ? "off_session"
              : undefined,
            storeCreditApplied: storeCredit,
            total: amount,
            isUpdated: !!storeCredit,
          });

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
      mode: { amount: amount, currencyCode: "USD" },
    }),
    []
  );

  const {
    embeddedPaymentElementView,
    confirm,
    loadingError,
    clearPaymentOption,
    update,
    isLoaded,
    paymentOption,
  } = useEmbeddedPaymentElement(
    intentConfig as IntentConfiguration,
    elementConfig as EmbeddedPaymentElementConfiguration
  );

  useEffect(() => {
    const updatePaymentIntent = async () => {
      if (
        storeCredit <= 0 ||
        loadingError ||
        !update ||
        !isLoaded ||
        amount - storeCredit <= 0
      ) {
        return;
      }
      const newAmount = amount - storeCredit;
      if (newAmount > 0) {
        console.log("🚀 ~ StripeWrapper ~ newAmount:", newAmount);
        try {
          await update({
            ...intentConfig,
            mode: { amount: newAmount, currencyCode: "USD" },
          });
        } catch (error) {
          console.log("Error updating payment intent:", error);
        }
      }
    };

    updatePaymentIntent();
  }, [amount, update, loadingError, isLoaded, storeCredit, total]);

  if (!intentConfig || !elementConfig) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  console.log("isLoaded ", isLoaded);

  console.log("loadingError ", loadingError);

  return (
    <View>
      <View>
        {loadingError && (
          <View>
            <Text style={styles.errorText}>
              Failed to load payment form:
              {loadingError.message || String(loadingError)}
            </Text>
          </View>
        )}
        <View
          style={{
            opacity: isLoaded ? 1 : 0,
            minHeight: 300,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {embeddedPaymentElementView}
        </View>
        {!isLoaded && (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator />
          </View>
        )}
      </View>
      <Text style={{ marginVertical: 8 }}>
        Selected Payment Method: {paymentOption ? paymentOption.label : "None"}
      </Text>
      <Button
        title="Confirm Payment"
        onPress={async () => {
          try {
            const result = await confirm();

            switch (result.status) {
              case "completed":
                // Payment completed - show a confirmation screen.
                console.log("Success", "Payment was completed successfully!");
                break;
              case "failed":
                // Encountered an unrecoverable error. You can display the error to the user, log it, and so on.
                console.log("Error", `Payment failed: ${result.error.message}`);
                break;
              case "canceled":
                // Customer canceled - you should probably do nothing.
                console.log("Payment was canceled by the user");
                break;
            }
            clearPaymentOption();
          } catch (error) {
            clearPaymentOption();
            // Handle any unexpected errors
            console.error("Unexpected error during confirmation:", error);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: "red",
    marginBottom: 8,
  },
});
