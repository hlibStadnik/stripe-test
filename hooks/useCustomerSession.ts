import { createCustomerSession } from "@/utils/stripeApi";
import { useEffect, useState } from "react";

export function useCustomerSession() {
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerSessionClientSecret, setCustomerSessionClientSecret] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const setupCustomer = async () => {
      try {
        setIsLoading(true);
        const session = await createCustomerSession();
        if (session) {
          console.log("✅ Customer session created:", session.customer);
          setCustomerId(session.customer);
          setCustomerSessionClientSecret(session.customerSessionClientSecret);
        } else {
          console.error("❌ Failed to create customer session");
          setError(new Error("Failed to create customer session"));
        }
      } catch (err) {
        console.error("❌ Error creating customer session:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    setupCustomer();
  }, []);

  return {
    customerId,
    customerSessionClientSecret,
    isLoading,
    error,
  };
}
