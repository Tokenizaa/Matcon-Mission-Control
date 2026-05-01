import { offlineInsert } from "./api";
import type { TableName } from "./db";

export type EventType = 
  | "customer_created" 
  | "customer_updated"
  | "customer_replied"
  | "quote_created" 
  | "quote_sent" 
  | "quote_approved" 
  | "quote_updated"
  | "order_created" 
  | "order_status_changed"
  | "payment_generated" 
  | "payment_paid" 
  | "payment_failed"
  | "inventory_reserved" 
  | "inventory_updated"
  | "xml_imported"
  | "whatsapp_message_received"
  | "whatsapp_message_sent"
  | "cart_created"
  | "cart_updated"
  | "cart_abandoned"
  | "checkout_started"
  | "checkout_completed"
  | "quote_requested";

export async function emitEvent(
  tenantId: string,
  aggregateType: string,
  aggregateId: string,
  eventType: EventType,
  payload: Record<string, unknown> = {}
) {
  try {
    const event = {
      tenant_id: tenantId,
      aggregate_type: aggregateType,
      aggregate_id: aggregateId,
      event_type: eventType,
      payload: {
        ...payload,
        timestamp: new Date().toISOString(),
      },
    };

    await offlineInsert("event_store", event as Row<"event_store">);
    console.log(`[EventStore] ${eventType} recorded for ${aggregateType}:${aggregateId}`);
    return event;
  } catch (err) {
    console.error("[EventStore] Failed to emit event", err);
  }
}
