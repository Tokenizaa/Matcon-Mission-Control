import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Pix Webhook Received:", body);

    // Mocked validation for Pix Gateway payload
    // In a real scenario, verify signature here
    const { paymentId, status, txid } = body;

    if (status !== "PAID") {
      return new Response(JSON.stringify({ message: "Status not PAID, ignoring" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 200,
      });
    }

    // 1. Find the payment record
    // We assume the gateway sends back an ID we provided during creation (txid or metadata)
    const { data: payment, error: pError } = await supabaseClient
      .from("payments")
      .select("*, orders(*)")
      .eq("id", paymentId)
      .single();

    if (pError || !payment) {
      console.error("Payment not found:", paymentId);
      return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: corsHeaders });
    }

    if (payment.status === "pago") {
      return new Response(JSON.stringify({ message: "Already paid" }), { status: 200, headers: corsHeaders });
    }

    // 2. Atomic update: Payment -> Pago, Order -> Pago (or Separando)
    const { error: updateError } = await supabaseClient
      .from("payments")
      .update({ status: "pago", paid_at: new Date().toISOString() })
      .eq("id", paymentId);

    if (updateError) throw updateError;

    if (payment.order_id) {
      await supabaseClient
        .from("orders")
        .update({ status: "pago" }) // Custom status flow: aguardando -> pago
        .eq("id", payment.order_id);
      
      console.log(`Order ${payment.order_id} marked as PAID`);
    }

    // 3. Log the successful sync
    await supabaseClient.from("sync_audit").insert({
      user_id: payment.user_id,
      table_name: "payments",
      record_id: paymentId as any, // Supabase types sometimes weird in Deno
      resolution: "remote_won",
      note: `Pix processado via Webhook. TXID: ${txid ?? 'N/A'}`,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 200,
    });
  } catch (error: any) {
    console.error("Webhook Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
      status: 400,
    });
  }
});
