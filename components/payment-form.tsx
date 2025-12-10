import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import {
  EmbeddedPaymentElementConfiguration,
  IntentCreationCallbackParams,
  IntentCreationError,
  RowStyle,
  useEmbeddedPaymentElement,
  AppearanceParams,
  PaymentMethod,
} from "@stripe/stripe-react-native";
import type * as PaymentSheetTypes from "@stripe/stripe-react-native/lib/typescript/src/types/PaymentSheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "@/utils/config";

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

interface PaymentElementWrapperProps {
  intentConfig: PaymentSheetTypes.IntentConfiguration;
  elementConfig: EmbeddedPaymentElementConfiguration;
  isUpdating: boolean;
  onConfirm: (confirmFn: () => Promise<any>) => void;
  onLoadingError: (error: Error | null) => void;
}

function PaymentElementWrapper({
  intentConfig,
  elementConfig,
  isUpdating,
  onConfirm,
  onLoadingError,
}: PaymentElementWrapperProps) {
  const [containerHeight, setContainerHeight] = useState<number>(200);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasSetHeightRef = useRef(false);
  const containerRef = useRef<View>(null);

  // Use embedded payment element hook
  const { embeddedPaymentElementView, confirm, loadingError } =
    useEmbeddedPaymentElement(intentConfig, elementConfig);

  // Measure container height after element renders
  // const handleLayout = useCallback((event: any) => {
  //   const timer = setTimeout(() => {
  //     const { height } = event?.nativeEvent?.layout;
  //     if (!hasSetHeightRef.current && height > 0) {
  //       console.log("📏 Measured container height:", height);
  //       setContainerHeight(height);
  //       hasSetHeightRef.current = true;
  //     }
  //   }, 700);
  // }, []);

  // Mark as loaded after element appears
  useEffect(() => {
    if (embeddedPaymentElementView && !hasSetHeightRef.current) {
      const timer = setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [embeddedPaymentElementView]);

  // Pass confirm function to parent
  useEffect(() => {
    if (confirm) {
      onConfirm(() => () => confirm());
    }
  }, [confirm, onConfirm]);

  // Pass loading error to parent
  useEffect(() => {
    onLoadingError(loadingError);
  }, [loadingError, onLoadingError]);

  const showLoading = isInitialLoading || isUpdating;

  return (
    <View
      ref={containerRef}
      // onLayout={handleLayout}
      style={[
        styles.paymentElementContainer,
        { height: hasSetHeightRef.current ? containerHeight : "auto" },
      ]}
    >
      {showLoading && (
        <View style={styles.updateOverlay}>
          <ActivityIndicator size="large" color="#635BFF" />
          <Text style={styles.updateText}>
            {isInitialLoading
              ? "Loading payment form..."
              : "Updating payment details..."}
          </Text>
        </View>
      )}
      <View style={{ opacity: showLoading ? 0.3 : 1 }}>
        {embeddedPaymentElementView}
      </View>
    </View>
  );
}

export function PaymentForm({
  amount,
  customerId,
  customerSessionClientSecret,
  storeCredit = 0,
  setConfirmCallback,
  total = 0,
}: PaymentFormProps) {
  // Enhanced appearance configuration following Stripe's example

  const elementConfig: EmbeddedPaymentElementConfiguration = useMemo(
    () => ({
      merchantDisplayName: "Nellis Auction",
      customerId: customerId,
      customerSessionClientSecret: customerSessionClientSecret,
      returnURL: "com.nellis.stripe://stripe-redirect",
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

  // Confirm handler - called when payment is being processed
  const handleConfirm = useCallback(
    async (
      paymentMethod: PaymentMethod.Result,
      shouldSavePaymentMethod: boolean,
      intentCreationCallback: (params: IntentCreationCallbackParams) => void
    ) => {
      try {
        console.log("🔐 Payment method received:", paymentMethod.id);
        console.log("💾 Save payment method:", shouldSavePaymentMethod);

        // Call backend to create/confirm payment intent
        const response = await fetch(`${API_URL}/create-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            amount,
            currency: "usd",
            customerId,
            setup_future_usage: shouldSavePaymentMethod
              ? "off_session"
              : undefined,
            storeCreditApplied: storeCredit,
          }),
        });

        const data = await response.json();

        if (data.paidWithStoreCredit) {
          Alert.alert(
            "Success",
            `Payment completed with store credit! $${(amount / 100).toFixed(
              2
            )} used.`
          );
          intentCreationCallback({ clientSecret: "" });
          return;
        }

        if (data.error) {
          throw new Error(data.error.message || data.error);
        }

        if (!data.clientSecret) {
          throw new Error("No client secret returned from server");
        }

        console.log("✅ Payment intent created successfully");
        intentCreationCallback({ clientSecret: data.clientSecret });
      } catch (error: any) {
        console.error("❌ Error in confirm handler:", error);
        intentCreationCallback({
          error: {
            code: "Failed",
            message: error.message || "Unknown error occurred",
            localizedMessage: error.message || "Unknown error occurred",
          } as IntentCreationError,
        });
      }
    },
    [amount, storeCredit, customerId]
  );

  // State for updating and error handling
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingError, setLoadingError] = useState<Error | null>(null);
  const [confirmFn, setConfirmFn] = useState<(() => Promise<any>) | null>(null);
  const previousStoreCreditRef = useRef(storeCredit);

  // Intent configuration with confirm handler - dynamically update amount
  const intentConfig: PaymentSheetTypes.IntentConfiguration = useMemo(() => {
    const newAmount = Math.max(0, amount - storeCredit);
    return {
      confirmHandler: handleConfirm,
      mode: {
        amount: newAmount,
        currencyCode: "USD",
      },
    };
  }, [handleConfirm, amount, storeCredit]);

  // Handle store credit changes with loading state
  useEffect(() => {
    // Check if store credit actually changed
    if (previousStoreCreditRef.current === storeCredit) {
      return;
    }

    console.log("💰 Store credit changed, triggering update");
    previousStoreCreditRef.current = storeCredit;

    // Show loading overlay for 2 seconds
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [storeCredit]);

  // Provide confirm callback to parent component
  useEffect(() => {
    if (setConfirmCallback && confirmFn) {
      setConfirmCallback(() => confirmFn);
    }
  }, [confirmFn, setConfirmCallback]);

  return (
    <View>
      {/* Error Display */}
      {loadingError && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Failed to load payment form:</Text>
          <Text style={styles.errorText}>
            {loadingError.message || String(loadingError)}
          </Text>
        </View>
      )}

      {/* Payment Element View with Loading Overlay */}
      <PaymentElementWrapper
        intentConfig={intentConfig}
        elementConfig={elementConfig}
        isUpdating={isUpdating}
        onConfirm={setConfirmFn}
        onLoadingError={setLoadingError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    padding: 12,
    backgroundColor: "#fee",
    margin: 8,
    borderRadius: 8,
  },
  errorTitle: {
    color: "#900",
    fontWeight: "600",
    marginBottom: 4,
  },
  errorText: {
    color: "#900",
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  processingText: {
    marginTop: 8,
    fontSize: 14,
    color: "#636366",
  },
  paymentOptionContainer: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  paymentOptionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  paymentElementContainer: {
    position: "relative",
    width: "100%",
  },
  updateOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    borderRadius: 8,
  },
  updateText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#635BFF",
  },
});
