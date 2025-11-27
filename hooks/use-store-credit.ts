import { useState, useEffect } from "react";
import { API_URL } from "@/utils/config";

export function useStoreCredit(customerId: string | null) {
  const [storeCredit, setStoreCredit] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStoreCredit = async () => {
      if (customerId) {
        try {
          setIsLoading(true);
          const response = await fetch(`${API_URL}/store-credit/${customerId}`);
          const data = await response.json();
          setStoreCredit(data.balance || 0);
          console.log("💰 Store credit balance:", data.balance);
        } catch (err) {
          console.error("Failed to fetch store credit:", err);
          setError(err as Error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchStoreCredit();
  }, [customerId]);

  return {
    storeCredit,
    isLoading,
    error,
  };
}
