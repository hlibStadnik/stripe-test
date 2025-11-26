export type Nullable<T> = T | null;

export interface FailedPayment {
  customer: {
    id: Nullable<string>,
    email: Nullable<string>,
    name: Nullable<string>,
  },
  payment_intent: {
    created: number,
    description: Nullable<string>,
    status: string
    error: Nullable<string>,
  },
  payment_method: {
    last4: Nullable<string>,
    brand: Nullable<string>,
  }
}