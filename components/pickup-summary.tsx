import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PickupItem {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

interface PickupSummaryProps {
  items: PickupItem[];
  pickupDate: string;
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  subtotal: number;
  buyerPremium: number;
  tax: number;
  onPay: () => void;
  isProcessing?: boolean;
  onChangeDate?: () => void;
}

export function PickupSummary({
  items,
  pickupDate,
  location,
  subtotal,
  buyerPremium,
  tax,
  onPay,
  isProcessing = false,
  onChangeDate,
}: PickupSummaryProps) {
  const [fullName, setFullName] = useState("");

  const total = subtotal + buyerPremium + tax;

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pick Ups Summary</Text>

      {/* Items List */}
      <View style={styles.itemsContainer}>
        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <Ionicons name="cube-outline" size={24} color="#333" />
            </View>
            <Text style={styles.itemText} numberOfLines={2}>
              {item.name}
              {item.description && (
                <Text style={styles.itemDescription}> {item.description}</Text>
              )}
            </Text>
          </View>
        ))}
      </View>

      {/* Pickup Date */}
      <View style={styles.dateRow}>
        <View style={styles.dateIconContainer}>
          <Ionicons name="calendar-outline" size={20} color="#333" />
        </View>
        <Text style={styles.dateText}>{pickupDate}</Text>
        {onChangeDate && (
          <TouchableOpacity onPress={onChangeDate} style={styles.changeButton}>
            <Ionicons name="create-outline" size={18} color="#2196F3" />
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Location */}
      <View style={styles.locationRow}>
        <View style={styles.locationIconContainer}>
          <Ionicons name="location-outline" size={20} color="#333" />
        </View>
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>{location.address}</Text>
          <Text style={styles.locationText}>
            {location.city}, {location.state}, {location.zip}
          </Text>
        </View>
      </View>

      {/* Price Breakdown */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Sub total</Text>
          <Text style={styles.priceValue}>{formatCurrency(subtotal)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Buyer Premium</Text>
          <Text style={styles.priceValue}>{formatCurrency(buyerPremium)}</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>Tax</Text>
          <Text style={styles.priceValue}>{formatCurrency(tax)}</Text>
        </View>
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>
      </View>

      {/* Authorization Section */}
      <View style={styles.authSection}>
        <Text style={styles.authTitle}>
          Authorized person to pick up on my behalf
        </Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Full name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter name here"
            placeholderTextColor="#999"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, isProcessing && styles.payButtonDisabled]}
        onPress={onPay}
        disabled={isProcessing}
      >
        <Text style={styles.payButtonText}>
          {isProcessing ? "PROCESSING..." : "PAY"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  itemsContainer: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  itemDescription: {
    color: "#666",
    fontSize: 13,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  dateIconContainer: {
    marginRight: 8,
  },
  dateText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  changeButtonText: {
    fontSize: 14,
    color: "#2196F3",
    marginLeft: 4,
    fontWeight: "600",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  locationIconContainer: {
    marginRight: 8,
    marginTop: 2,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  priceContainer: {
    paddingVertical: 16,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: "#666",
  },
  priceValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  totalLabel: {
    fontSize: 16,
    color: "#000",
    fontWeight: "700",
  },
  totalValue: {
    fontSize: 18,
    color: "#8B1A1A",
    fontWeight: "700",
  },
  authSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  authTitle: {
    fontSize: 14,
    color: "#333",
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d0d0",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#000",
    backgroundColor: "#fff",
  },
  payButton: {
    backgroundColor: "#e53935",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  payButtonDisabled: {
    opacity: 0.6,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
