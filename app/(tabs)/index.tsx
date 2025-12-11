import { Image } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
  Switch,
  TextInput,
} from "react-native";

import ParallaxScrollView from "@/components/parallax-scroll-view";
import { useState } from "react";
import { PaymentForm } from "@/components/payment-form";
import { PickupSummary } from "@/components/pickup-summary";
import { Stepper } from "@/components/stepper";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { useStoreCredit } from "@/hooks/use-store-credit";
import { useRouter } from "expo-router";

const moneyAmount = (() => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours * 100 + minutes;
})();

export default function HomeScreen() {
  const router = useRouter();
  const { customerId, customerSessionClientSecret } = useCustomerSession();
  const { storeCredit } = useStoreCredit(customerId);

  // Payment confirm functions
  const [confirmA, setConfirmA] = useState<(() => Promise<any>) | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);

  const [isStoreCreditApplied, setIsStoreCreditApplied] = useState(false);
  const [storeCreditInput, setStoreCreditInput] = useState("");
  const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);

  const handlePayAll = async () => {
    setIsProcessing(true);

    try {
      // Execute payment 1 only if amount > 0
      if (moneyAmount > 0 && !!confirmA) {
        console.log("Executing Payment 1...");
        const result1 = await confirmA();
        console.log("🚀 ~ handlePayAll ~ result1:", result1);
        if (result1.status === "failed") {
          throw new Error(`Payment 1 failed: ${result1.error.message}`);
        }
        if (result1.status === "canceled") {
          console.log("Payment 1 canceled:", result1);
          return;
        }
      }

      // Navigate to confirmation screen on success
      const totalAmount = moneyAmount - appliedStoreCredit;
      router.push({
        pathname: "/confirm-payment",
        params: {
          amount: totalAmount.toFixed(2),
          customerName: "Jorge",
          appointmentDate: "Sep 15, 2025, 4:00 PM",
          location: "7400 Dean Martin Dr Suite 204\nLas Vegas, NV 89139",
        },
      });
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
      {/* Stepper */}
      

      {/* Payment Methods Section */}
      <View style={styles.paymentMethodsContainer}>
        <Text style={styles.paymentMethodsTitle}>PAYMENT METHODS</Text>
        <Text style={styles.paymentMethodsSubtitle}>
          Choose your payment method
        </Text>
      </View>

      <PaymentForm
        amount={moneyAmount - appliedStoreCredit}
        customerId={customerId}
        customerSessionClientSecret={customerSessionClientSecret}
        storeCredit={appliedStoreCredit}
        setConfirmCallback={setConfirmA}
        total={moneyAmount}
        isProcessingExternal={isProcessing}
      />

      <View style={styles.splitToggleContainer}>
        <Text style={styles.splitLabel}>Use Store Credit</Text>
        <Switch
          value={isStoreCreditApplied}
          onValueChange={() => setIsStoreCreditApplied(!isStoreCreditApplied)}
        />
      </View>
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
                const maxCredit = Math.min(storeCredit, moneyAmount);
                const appliedStoreCredit = Math.min(creditAmount, maxCredit);

                setAppliedStoreCredit(appliedStoreCredit);
              }}
            />
          </View>
         
        </View>
      )}

      
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
    padding: 10,
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
  tempButtonContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
});
