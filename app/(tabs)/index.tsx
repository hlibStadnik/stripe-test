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
  TouchableOpacity,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { useEffect, useState } from "react";
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
  const [paymentAmountA, setPaymentAmountA] = useState(moneyAmount);
  const [paymentAmountB, setPaymentAmountB] = useState(300);

  // Payment confirm functions
  const [confirmA, setConfirmA] = useState<(() => Promise<any>) | null>(null);
  const [confirmB, setConfirmB] = useState<(() => Promise<any>) | null>(null);
  const [paymentTypeA, setPaymentTypeA] = useState("");
  const [paymentTypeB, setPaymentTypeB] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment1Change = (value: string) => {
    setPaymentAmountA(value);
    const amount1 = parseFloat(value);
    if (!isNaN(amount1) && amount1 >= 0) {
      const remainingCents = moneyAmount - Math.round(amount1 * 100);
      const remaining = Math.max(0, remainingCents / 100);
      setPaymentAmountB(remaining.toFixed(2));
    }
  };

  const onSplitToggle = (value: boolean) => {
    if (!value) {
      setPaymentAmountA(moneyAmount);
      setPaymentAmountB(0);
    } else {
      const half = (moneyAmount / 2).toFixed(2);
      setPaymentAmountA(300);
      setPaymentAmountB(400);
    }
    setEnableSplitPayment(value);
  };

  const handlePayment2Change = (value: string) => {
    setPaymentAmountB(value);
    const amount2 = parseFloat(value);
    if (!isNaN(amount2) && amount2 >= 0) {
      const remainingCents = moneyAmount - Math.round(amount2 * 100);
      const remaining = Math.max(0, remainingCents / 100);
      setPaymentAmountA(remaining.toFixed(2));
    }
  };

  const totalSplit = paymentAmountA + paymentAmountB;

  const handlePayAll = async () => {
    if (!enableSplitPayment) {
      // Single payment mode
      if (!confirmA) {
        Alert.alert("Error", "Payment method not ready");
        return;
      }

      setIsProcessing(true);

      try {
        console.log("Executing Single Payment...");
        const result = await confirmA();
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
    // if (totalSplit !== moneyAmount) {
    //   Alert.alert(
    //     "Error",
    //     `Split payments must total exactly $${(moneyAmount / 100).toFixed(2)}`
    //   );
    //   return;
    // }

    setIsProcessing(true);

    try {
      // Execute payment 1 only if amount > 0
      if (paymentAmountA > 0 && !!confirmA) {
        console.log("Executing Payment 1...");
        const result1 = await confirmA();
        if (result1.status === "failed") {
          throw new Error(`Payment 1 failed: ${result1.error.message}`);
        }
        console.log("Payment 1 completed:", result1.status);
      }

      // Execute payment 2 only if amount > 0
      if (paymentAmountB > 0 && !!confirmB) {
        console.log("Executing Payment 2...");
        const result2 = await confirmB();
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

  const [isStoreCreditApplied, setIsStoreCreditApplied] = useState(false);
  const [storeCreditInput, setStoreCreditInput] = useState("");
  const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);

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
      {/* {enableSplitPayment && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment 1 Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={paymentAmountA}
              onChangeText={handlePayment1Change}
              keyboardType="numeric"
              placeholder="0.00"
              editable={!isProcessing}
            />
          </View>
        </>
      )} */}

      <PaymentForm
        amount={paymentAmountA - appliedStoreCredit}
        customerId={customerId}
        customerSessionClientSecret={customerSessionClientSecret}
        storeCredit={storeCredit}
        setConfirmCallback={setConfirmA}
        total={moneyAmount}
        isProcessingExternal={isProcessing}
        isSplittingPayment={enableSplitPayment}
        otherPaymentType={paymentTypeB}
      />

      {/* Custom Store Credit Option */}
      {/* <TouchableOpacity
        style={[
          isStoreCreditApplied && styles.methodCardSelected,
          {
            paddingVertical: 25,
          },
        ]}
        onPress={() => setIsStoreCreditApplied(!isStoreCreditApplied)}
      >
        <View style={styles.methodRow}>
          <View style={styles.radioOuter}>
            {isStoreCreditApplied && <View style={styles.radioInner} />}
          </View>
          <Image
            source={require("@/assets/images/credit.png")}
            resizeMode="contain"
            style={{ width: 20, height: 20, marginRight: 8, marginLeft: 4 }}
          />
          <Text>Store credit</Text>
        </View>
      </TouchableOpacity> */}

      <View style={styles.splitToggleContainer}>
        <Text style={styles.splitLabel}>Use Store Credit</Text>
        {/* <Text style={styles.splitLabel}>Split payment</Text> */}
        <Switch
          value={isStoreCreditApplied}
          // disabled={true}
          onValueChange={() => setIsStoreCreditApplied(!isStoreCreditApplied)}
        />
      </View>
      {/* Store Credits Input */}
      {isStoreCreditApplied && (
        <View style={styles.storeCreditInputContainer}>
          <Text style={styles.inputLabel}>
            Apply Store Credits (Available: ${(storeCredit / 100).toFixed(2)})
          </Text>
          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={storeCreditInput}
              onChangeText={(text) => {
                setStoreCreditInput(text);
                const creditAmount = Math.round(parseFloat(text || "0") * 100);
                const maxCredit = Math.min(storeCredit, paymentAmountA);
                const appliedStoreCredit = Math.min(creditAmount, maxCredit);

                setAppliedStoreCredit(appliedStoreCredit);
              }}
            />
          </View>
          {appliedStoreCredit > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Original Amount:</Text>
              <Text style={styles.calculationValue}>
                ${(paymentAmountA / 100).toFixed(2)}
              </Text>
            </View>
          )}
          {appliedStoreCredit > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>Store Credit Applied:</Text>
              <Text style={[styles.calculationValue, styles.creditApplied]}>
                -${(appliedStoreCredit / 100).toFixed(2)}
              </Text>
            </View>
          )}
          {appliedStoreCredit > 0 && (
            <View style={[styles.calculationRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Amount to Charge:</Text>
              <Text style={styles.totalValue}>
                $
                {Math.max(
                  0,
                  (paymentAmountA - appliedStoreCredit) / 100
                ).toFixed(2)}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* {enableSplitPayment && (
        <>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment 2 Amount ($)</Text>
            <TextInput
              style={styles.input}
              value={paymentAmountB}
              onChangeText={handlePayment2Change}
              keyboardType="numeric"
              placeholder="0.00"
              editable={!isProcessing}
            />
          </View>

          <PaymentForm
            amount={paymentAmountB}
            customerId={customerId}
            customerSessionClientSecret={customerSessionClientSecret}
            setConfirmCallback={setConfirmB}
            isProcessingExternal={isProcessing}
            isSplittingPayment={enableSplitPayment}
            otherPaymentType={paymentTypeA}
          />
        </>
      )}
      {enableSplitPayment && (
        <View style={styles.splitInputsContainer}>
          <Text style={styles.totalSplitText}>
            Total Split: ${(totalSplit / 100).toFixed(2)} / $
            {(moneyAmount / 100).toFixed(2)}
          </Text>
        </View>
      )} */}
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
    justifyContent: "flex-end",
    alignItems: "center",
    // padding: 16,
  },
  splitLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  splitInputsContainer: {
    padding: 16,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    width: "auto",
  },
  totalSplitText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B1A1A",
    textAlign: "center",
    marginTop: 8,
  },
  payButtonContainer: {
    marginTop: 16,
    marginBottom: 24,
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
