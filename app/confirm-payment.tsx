import { useRouter, useLocalSearchParams } from "expo-router";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ConfirmPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Parse parameters
  const amount = params.amount ? parseFloat(params.amount as string) : 1.28;
  const customerName = (params.customerName as string) || "Jorge";
  const appointmentDate =
    (params.appointmentDate as string) || "Sep 15, 2025, 4:00 PM";
  const location =
    (params.location as string) ||
    "7400 Dean Martin Dr Suite 204\nLas Vegas, NV 89139";

  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };

  return (
    <ScrollView
      style={[styles.container, isDark && styles.containerDark]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Success Icon */}
      <View style={styles.successIconContainer}>
        <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
      </View>

      {/* Thank You Message */}
      <Text style={[styles.thankYouText, isDark && styles.textDark]}>
        Thank you, {customerName}
      </Text>

      <Text
        style={[styles.confirmationText, isDark && styles.textSecondaryDark]}
      >
        Your payment of {formatCurrency(amount)} has been successfully processed
      </Text>

      {/* Important Instructions Section */}
      <View style={styles.infoSection}>
        <View style={styles.infoHeader}>
          <Ionicons name="warning-outline" size={20} color="#FF9800" />
          <Text style={styles.infoHeaderText}>Important instructions</Text>
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.bulletPoint}>
            • When you arrive, please park in the numbered space parking section
          </Text>
          <Text style={styles.bulletPoint}>
            • Please call the phone number to check you in
          </Text>
          <Text style={styles.bulletPoint}>
            • Our staff will bring your order right to your vehicle
          </Text>
        </View>

        <View style={styles.scheduleSection}>
          <Text style={styles.scheduleBoldText}>Always schedule ahead!</Text>
          <Text style={styles.scheduleText}>
            Our auction site has no waiting customers so if it shows on your
            calendar it is first come first served. If you schedule a slot and
            pick it up later, if you cannot make it we ask that you call (702)
            605-6105 to be removed from your slot.
          </Text>
        </View>
      </View>

      {/* Appointment Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Ionicons name="calendar-outline" size={20} color="#2196F3" />
          <Text style={styles.detailsHeaderText}>Appointment details</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Scheduled for:</Text>
          <Text style={styles.detailValue}>{appointmentDate}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue}>{location}</Text>
        </View>

        <View style={styles.calloutBox}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#2196F3"
          />
          <Text style={styles.calloutText}>
            Please be advised that we have placed a pending authorization. We
            will finalize this transaction when you pick up your items. If you
            cancel or are a no show you will be charged the full amount. Call
            (702) 605-6105 to be removed from your slot.
          </Text>
        </View>
      </View>

      {/* Payment Details Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Ionicons name="card-outline" size={20} color="#4CAF50" />
          <Text style={styles.detailsHeaderText}>Payment details</Text>
        </View>

        <View style={styles.paymentMethodRow}>
          <Ionicons name="card" size={24} color="#333" />
          <Text style={styles.paymentMethodText}>
            1 Visa/•• 1520/1001 Parkmore (Braintree #1 22, Red, Black)
          </Text>
          <Text style={styles.paymentAmount}>{formatCurrency(amount)}</Text>
        </View>

        <View style={styles.paymentDateRow}>
          <Ionicons name="calendar-outline" size={18} color="#666" />
          <Text style={styles.paymentDateText}>Wed Jul 23, 5:38 PM</Text>
        </View>

        <View style={styles.paymentLocationRow}>
          <Ionicons name="location-outline" size={18} color="#666" />
          <Text style={styles.paymentLocationText}>
            4031 Market Center Dr Suite 301 North Las Vegas, NV 89031
          </Text>
        </View>
      </View>

      {/* Items Awaiting Pickup Section */}
      <View style={styles.detailsSection}>
        <View style={styles.detailsHeader}>
          <Ionicons name="cube-outline" size={20} color="#9C27B0" />
          <Text style={styles.detailsHeaderText}>Items awaiting pick-up</Text>
        </View>

        <View style={styles.itemRow}>
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#999" />
          </View>
          <Text style={styles.itemName}>Box 2</Text>
          <Text style={styles.itemPrice}>$111.00</Text>
        </View>

        <View style={styles.itemRow}>
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#999" />
          </View>
          <Text style={styles.itemName}>
            1 lot of assorted mattress toppers/pads
          </Text>
          <Text style={styles.itemPrice}>$3.00</Text>
        </View>

        <View style={styles.itemRow}>
          <View style={styles.itemImagePlaceholder}>
            <Ionicons name="image-outline" size={24} color="#999" />
          </View>
          <Text style={styles.itemName}>1 Sleepy Furniture Couch</Text>
          <Text style={styles.itemPrice}>$12.00</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>GO TO HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => {
          // Navigate to pickup scheduling or home
          router.back();
        }}
      >
        <Text style={styles.primaryButtonText}>SCHEDULE PICK-UP</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  containerDark: {
    backgroundColor: "#1a1a1a",
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  successIconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  thankYouText: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    color: "#000",
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  textDark: {
    color: "#fff",
  },
  textSecondaryDark: {
    color: "#aaa",
  },

  // Info Section
  infoSection: {
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginLeft: 8,
  },
  infoContent: {
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    marginBottom: 4,
  },
  scheduleSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#FFE082",
  },
  scheduleBoldText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2196F3",
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 18,
  },

  // Details Sections
  detailsSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  detailsHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginLeft: 8,
  },
  detailItem: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  calloutBox: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#2196F3",
  },
  calloutText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 18,
    marginLeft: 8,
  },

  // Payment Details
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
  },
  paymentMethodText: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    marginLeft: 12,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4CAF50",
  },
  paymentDateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 12,
  },
  paymentDateText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  paymentLocationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 12,
  },
  paymentLocationText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
    lineHeight: 18,
  },

  // Items Section
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },

  // Buttons
  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d0d0d0",
  },
  secondaryButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#e53935",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
