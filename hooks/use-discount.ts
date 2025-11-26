import { useCallback } from "react";
import { IntentConfiguration } from "@stripe/stripe-react-native";
import { API_URL } from "@/utils/config";

export function useDiscount(
  intentConfig: IntentConfiguration | null,
  update: (config: IntentConfiguration) => void
) {
  const handleUpdate = useCallback(() => {
    if (!intentConfig) return;

    // Create a new IntentConfiguration object with updated values
    const updatedIntentConfig: IntentConfiguration = {
      ...intentConfig,
      mode: {
        amount: 999, // Updated amount after applying discount code
        currencyCode: "USD",
      },
    };

    try {
      update(updatedIntentConfig);
    } catch (error) {
      // Handle any unexpected errors
      console.error("Unexpected error during update:", error);
    }
  }, [intentConfig, update]);

  const applyDiscountCode = useCallback(
    async (discountCode: string) => {
      // Validate discount code with your server
      try {
        const response = await fetch(`${API_URL}/apply-discount`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discountCode }),
        });

        if (response.ok) {
          console.log("🚀 ~ Discount applied ~ response:", response);
          // Update the intent configuration with the new amount
          handleUpdate();
        }
      } catch (error) {
        console.error("Failed to apply discount:", error);
      }
    },
    [handleUpdate]
  );

  return { applyDiscountCode };
}
