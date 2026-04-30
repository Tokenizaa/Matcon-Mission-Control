import { supabase } from "@/integrations/supabase/client";
import { brl, waLink, onlyDigits } from "@/lib/format";

export type WaKind = "quote" | "order" | "payment";

export interface QuoteCtx {
  customerName?: string;
  items: { quantity: number; product_name: string; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
}
export interface OrderCtx {
  customerName?: string;
  total: number;
  status: string;
}
export interface PaymentCtx {
  customerName?: string;
  amount: number;
  type: string;
  dueNote?: string;
}

export const waTemplates = {
  quote: (c: QuoteCtx) =>
    `*Orçamento Balcão* 🧾\n\nOlá ${c.customerName ?? ""}!\nSegue seu orçamento:\n\n${c.items
      .map((i) => `• ${i.quantity}x ${i.product_name} — ${brl(i.total)}`)
      .join("\n")}\n\nSubtotal: ${brl(c.subtotal)}\nDesconto: ${brl(c.discount)}\n*Total: ${brl(
      c.total
    )}*${c.notes ? `\n\n_${c.notes}_` : ""}\n\nQualquer dúvida é só chamar! 🙌`,

  order: (c: OrderCtx) =>
    `*Pedido confirmado* ✅\n\nOlá ${c.customerName ?? ""}!\nSeu pedido foi registrado.\n\n*Total: ${brl(
      c.total
    )}*\nStatus: ${c.status}\n\nObrigado pela preferência! 🛍️`,

  payment: (c: PaymentCtx) =>
    `*Cobrança Balcão* 💳\n\nOlá ${c.customerName ?? ""}!\nSegue cobrança de *${brl(
      c.amount
    )}* via *${c.type.toUpperCase()}*.${c.dueNote ? `\n${c.dueNote}` : ""}\n\nAssim que recebermos, confirmamos por aqui. 🙏`,
};

export interface SendWaParams {
  kind: WaKind;
  refId?: string;
  customerId?: string;
  phone?: string | null;
  message: string;
}

/** Logs the attempt and opens WhatsApp. Returns the opened link. */
export async function sendWhatsApp(params: SendWaParams): Promise<{ link: string | null; ok: boolean; error?: string }> {
  const phone = (params.phone ?? "").trim();
  let link: string | null = null;
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;

  try {
    if (!phone || onlyDigits(phone).length < 10) {
      throw new Error("Telefone do cliente inválido ou ausente");
    }
    link = waLink(phone, params.message);
    const win = typeof window !== "undefined" ? window.open(link, "_blank", "noopener,noreferrer") : null;
    if (!win) {
      // Popup may have been blocked — still treat as failed so user can retry.
      throw new Error("Janela do WhatsApp bloqueada pelo navegador");
    }
  } catch (e: any) {
    status = "failed";
    error = String(e?.message ?? e);
  }

  try {
    const { data: u } = await supabase.auth.getUser();
    const userId = u.user?.id;
    if (userId) {
      await supabase.from("wa_messages").insert({
        user_id: userId,
        kind: params.kind,
        ref_id: params.refId ?? null,
        customer_id: params.customerId ?? null,
        phone: phone || null,
        message: params.message,
        link,
        status,
        error: error ?? null,
      });
    }
  } catch {
    // Logging failures shouldn't break UX.
  }

  return { link, ok: status === "sent", error };
}

/** Re-open a previously logged message and update its status. */
export async function retryWhatsApp(row: { id: string; phone: string | null; message: string }) {
  let status: "sent" | "failed" = "sent";
  let error: string | undefined;
  let link: string | null = null;
  try {
    if (!row.phone) throw new Error("Sem telefone");
    link = waLink(row.phone, row.message);
    const win = window.open(link, "_blank", "noopener,noreferrer");
    if (!win) throw new Error("Janela bloqueada");
  } catch (e: any) {
    status = "failed";
    error = String(e?.message ?? e);
  }
  await supabase.from("wa_messages").update({ status, error: error ?? null, link }).eq("id", row.id);
  return { ok: status === "sent", error };
}
