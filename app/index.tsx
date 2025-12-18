import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { useCustomerSession } from "@/hooks/useCustomerSession";
import { PaymentForm } from "@/utils/PaymentForm";
import { useState } from "react";

const moneyAmount = (() => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return hours * 100 + minutes;
})();

export default function HomeScreen() {
  const { customerId, customerSessionClientSecret } = useCustomerSession();
  const storeCredit = 5000;

  const [isStoreCreditApplied, setIsStoreCreditApplied] = useState(false);
  const [storeCreditInput, setStoreCreditInput] = useState("");
  const [appliedStoreCredit, setAppliedStoreCredit] = useState(0);

  if (!customerId || !customerSessionClientSecret) {
    return (
      <ScrollView>
        <View style={{ paddingVertical: 16, alignItems: "center" }}>
          <ActivityIndicator size="large" />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ padding: 16 }}>
      <Text style={{ fontSize: 16, fontWeight: "bold" }}>
        moneyAmount: {(moneyAmount / 100).toFixed(2)}
      </Text>
      <PaymentForm
        amount={moneyAmount - appliedStoreCredit}
        customerId={customerId}
        customerSessionClientSecret={customerSessionClientSecret}
        storeCredit={appliedStoreCredit}
        total={moneyAmount}
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
    </ScrollView>
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
  splitToggleContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 26,
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
    marginTop: 26,
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
});
