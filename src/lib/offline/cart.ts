import { offlineInsert, offlineUpdate, offlineList } from "./api";
import { emitEvent } from "./events";
import type { Row } from "./db";

export interface CartItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export async function createCart(tenantId: string, customerId: string, items: CartItemInput[]) {
  // 1. Create Cart
  const cart = await offlineInsert("carts", {
    tenant_id: tenantId,
    customer_id: customerId,
    status: "active",
  });

  // 2. Add Items
  for (const item of items) {
    await offlineInsert("cart_items", {
      cart_id: cart.id,
      ...item,
    });
  }

  // 3. Emit Event
  await emitEvent(tenantId, "carts", cart.id, "cart_created", {
    customer_id: customerId,
    item_count: items.length,
    total: items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0)
  });

  return cart;
}

export async function abandonCart(tenantId: string, cartId: string) {
  const cart = await offlineUpdate("carts", cartId, { status: "abandoned" });
  
  await emitEvent(tenantId, "carts", cartId, "cart_abandoned", {
    customer_id: cart.customer_id
  });

  return cart;
}

export async function convertCartToQuote(tenantId: string, cartId: string) {
  // Logic to convert cart items into a Quote entity
  // This bridges the Commerce Engine with the Operational Core
  
  const carts = await offlineList("carts");
  const cart = carts.find(c => c.id === cartId);
  if (!cart) throw new Error("Cart not found");

  const cartItems = await offlineList("cart_items");
  const items = cartItems.filter(it => it.cart_id === cartId);

  // 1. Create Quote
  const quote = await offlineInsert("quotes", {
    user_id: tenantId,
    customer_id: cart.customer_id,
    status: "rascunho",
    total: items.reduce((acc, it) => acc + (Number(it.unit_price) * Number(it.quantity)), 0),
  });

  // 2. Map items to quote_items
  for (const it of items) {
    await offlineInsert("quote_items", {
      quote_id: quote.id,
      product_id: it.product_id,
      quantity: Number(it.quantity),
      price: Number(it.unit_price),
      total: Number(it.unit_price) * Number(it.quantity),
    });
  }

  // 3. Update Cart
  await offlineUpdate("carts", cartId, { status: "converted", metadata: { quote_id: quote.id } });

  // 4. Emit Events
  await emitEvent(tenantId, "carts", cartId, "checkout_completed", { quote_id: quote.id });
  await emitEvent(tenantId, "quotes", quote.id, "quote_requested", { cart_id: cartId });

  return quote;
}
