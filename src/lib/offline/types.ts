import type { OrderType, PaymentMethod } from "@/types/db";
import type { CartLine } from "@/actions/orders";

/** Payload replayed through createCheckoutOrder when back online. */
export type OfflineCheckoutPayload = {
  lines: CartLine[];
  customer_id: string | null;
  order_type: OrderType;
  scheduled_for: string | null;
  payment_method: PaymentMethod;
  notes: string | null;
  send_bill_sms: boolean;
  send_bill_email: boolean;
  send_ready_sms: boolean;
};

export type OfflineQueuedOrder = {
  client_queue_id: string;
  queued_at: string;
  payload: OfflineCheckoutPayload;
};
