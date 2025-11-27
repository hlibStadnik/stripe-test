import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Button,
  StyleSheet,
  Text,
  View,
  Switch,
  TextInput,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { useState } from "react";
import { PaymentForm } from "@/components/payment-form";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useStoreCredit } from "@/hooks/use-store-credit";

const moneyAmount = (() => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours * 100 + minutes;
})();

export default function HomeScreen() {
  const { customerId, customerSessionClientSecret } = useCustomerSession();
  const { storeCredit } = useStoreCredit(customerId);

  // Split payment controls
  const [enableSplitPayment, setEnableSplitPayment] = useState(false);
  const [payment1Amount, setPayment1Amount] = useState("");
  const [payment2Amount, setPayment2Amount] = useState("");

  // Payment confirm functions
  const [payment1Confirm, setPayment1Confirm] = useState<
    (() => Promise<any>) | null
  >(null);
  const [payment2Confirm, setPayment2Confirm] = useState<
    (() => Promise<any>) | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment1Change = (value: string) => {
    setPayment1Amount(value);
    const amount1 = parseFloat(value);
    if (!isNaN(amount1) && amount1 >= 0) {
      const remainingCents = moneyAmount - Math.round(amount1 * 100);
      const remaining = Math.max(0, remainingCents / 100);
      setPayment2Amount(remaining.toFixed(2));
    }
  };

  const handlePayment2Change = (value: string) => {
    setPayment2Amount(value);
    const amount2 = parseFloat(value);
    if (!isNaN(amount2) && amount2 >= 0) {
      const remainingCents = moneyAmount - Math.round(amount2 * 100);
      const remaining = Math.max(0, remainingCents / 100);
      setPayment1Amount(remaining.toFixed(2));
    }
  };

  const getPayment1AmountInCents = () => {
    const amount = parseFloat(payment1Amount);
    return !isNaN(amount) && amount > 0 ? Math.round(amount * 100) : 0;
  };

  const getPayment2AmountInCents = () => {
    const amount = parseFloat(payment2Amount);
    return !isNaN(amount) && amount > 0 ? Math.round(amount * 100) : 0;
  };

  const totalSplit = getPayment1AmountInCents() + getPayment2AmountInCents();

  const handlePayAll = async () => {
    if (!enableSplitPayment) {
      // Single payment mode
      if (!payment1Confirm) {
        Alert.alert("Error", "Payment method not ready");
        return;
      }

      setIsProcessing(true);

      try {
        console.log("Executing Single Payment...");
        const result = await payment1Confirm();
        if (result.status === "failed") {
          throw new Error(`Payment failed: ${result.error.message}`);
        }
        console.log("Payment completed:", result.status);
        Alert.alert("Success", "Payment completed successfully!");
      } catch (error: any) {
        console.error("Payment error:", error);
        Alert.alert("Error", error.message || "Payment failed");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Split payment mode
    if (totalSplit !== moneyAmount) {
      Alert.alert(
        "Error",
        `Split payments must total exactly $${(moneyAmount / 100).toFixed(2)}`
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Execute payment 1 only if amount > 0
      if (getPayment1AmountInCents() > 0 && payment1Confirm) {
        console.log("Executing Payment 1...");
        const result1 = await payment1Confirm();
        if (result1.status === "failed") {
          throw new Error(`Payment 1 failed: ${result1.error.message}`);
        }
        console.log("Payment 1 completed:", result1.status);
      }

      // Execute payment 2 only if amount > 0
      if (getPayment2AmountInCents() > 0 && payment2Confirm) {
        console.log("Executing Payment 2...");
        const result2 = await payment2Confirm();
        if (result2.status === "failed") {
          throw new Error(`Payment 2 failed: ${result2.error.message}`);
        }
        console.log("Payment 2 completed:", result2.status);
      }

      Alert.alert("Success", "All payments completed successfully!");
    } catch (error: any) {
      console.error("Payment error:", error);
      Alert.alert("Error", error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!customerId || !customerSessionClientSecret) {
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
      <View style={styles.headerContainer}>
        <Text style={styles.locationText}>North Las Vegas</Text>
        <Text style={styles.pickupsText}>Pick Ups 1</Text>
        <Text style={styles.totalText}>
          Total ${(moneyAmount / 100).toFixed(2)}
        </Text>
      </View>

      {/* Payment Methods Section */}
      <View style={styles.paymentMethodsContainer}>
        <Text style={styles.paymentMethodsTitle}>PAYMENT METHODS</Text>
        <Text style={styles.paymentMethodsSubtitle}>
          Choose your payment method
        </Text>
      </View>

      {/* Payment Forms */}

      <PaymentForm
        amount={moneyAmount}
        customerId={customerId}
        customerSessionClientSecret={customerSessionClientSecret}
        storeCredit={storeCredit}
        onConfirmReady={(fn) => setPayment1Confirm(() => fn)}
        isProcessingExternal={isProcessing}
        isSplittingPayment={enableSplitPayment}
      />

      <View style={styles.splitToggleContainer}>
        <Text style={styles.splitLabel}>Split payment</Text>
        <Switch
          value={enableSplitPayment}
          disabled={true}
          onValueChange={setEnableSplitPayment}
        />
      </View>
      {enableSplitPayment && (
        <>
          <Text>Todo: split with store credit</Text>

          {/* <PaymentForm
            amount={getPayment2AmountInCents()}
            customerId={customerId}
            customerSessionClientSecret={customerSessionClientSecret}
            onConfirmReady={(fn) => setPayment2Confirm(() => fn)}
            isProcessingExternal={isProcessing}
            isSplittingPayment={enableSplitPayment}
          /> */}
        </>
      )}

      <View style={styles.payButtonContainer}>
        <Button title={`Pay`} onPress={handlePayAll} disabled={isProcessing} />
        {isProcessing && <ActivityIndicator size="large" />}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: "#666",
    marginBottom: 16,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B1A1A",
    flex: 1,
  },
  pickupsText: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  totalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    flex: 1,
    textAlign: "right",
  },
  paymentMethodsContainer: {
    paddingVertical: 10,
  },
  paymentMethodsTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
  },
  paymentMethodsSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  splitToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  splitLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  payButtonContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
});
