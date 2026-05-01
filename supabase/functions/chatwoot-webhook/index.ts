import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Chatwoot webhook signature verification
function verifySignature(payload: string, signature: string, secret: string): boolean {
  // In production, implement HMAC-SHA256 verification
  // For now, we'll skip signature verification for development
  return true;
}

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
    console.log("Chatwoot Webhook Received:", JSON.stringify(body, null, 2));

    // Get event type from Chatwoot
    const event = body.event;
    const data = body;

    if (!event) {
      return new Response(JSON.stringify({ error: "Event type missing" }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
        status: 400,
      });
    }

    // Process different event types
    switch (event) {
      case "message_created":
        await handleMessageCreated(supabaseClient, data);
        break;
      
      case "conversation_created":
        await handleConversationCreated(supabaseClient, data);
        break;
      
      case "contact_created":
        await handleContactCreated(supabaseClient, data);
        break;
      
      case "conversation_status_changed":
        await handleConversationStatusChanged(supabaseClient, data);
        break;
      
      default:
        console.log(`Unhandled event type: ${event}`);
    }

    return new Response(JSON.stringify({ success: true, event }), {
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

// Handle new message from Chatwoot
async function handleMessageCreated(supabaseClient: any, data: any) {
  const message = data.message;
  const conversation = data.conversation;
  const contact = data.contact;

  // Extract message details
  const { error } = await supabaseClient.from("chatwoot_messages").insert({
    chatwoot_message_id: message.id,
    chatwoot_conversation_id: conversation.id,
    chatwoot_contact_id: contact.id,
    content: message.content,
    message_type: message.message_type,
    sender_type: message.sender_type,
    status: message.status,
    created_at: message.created_at,
    source_id: message.source_id,
  });

  if (error) {
    console.error("Error inserting message:", error);
    throw error;
  }

  console.log(`Message ${message.id} saved successfully`);

  // If it's an incoming message, check if it matches a customer
  if (message.sender_type === "contact") {
    await matchCustomerByPhone(supabaseClient, contact);
  }
}

// Handle new conversation
async function handleConversationCreated(supabaseClient: any, data: any) {
  const conversation = data.conversation;
  const contact = data.contact;

  const { error } = await supabaseClient.from("chatwoot_conversations").insert({
    chatwoot_conversation_id: conversation.id,
    chatwoot_contact_id: contact.id,
    inbox_id: conversation.inbox_id,
    status: conversation.status,
    agent_id: conversation.assignee?.id,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
  });

  if (error) {
    console.error("Error inserting conversation:", error);
    throw error;
  }

  console.log(`Conversation ${conversation.id} saved successfully`);
}

// Handle new contact
async function handleContactCreated(supabaseClient: any, data: any) {
  const contact = data.contact;

  const { error } = await supabaseClient.from("chatwoot_contacts").insert({
    chatwoot_contact_id: contact.id,
    name: contact.name,
    email: contact.email,
    phone_number: contact.phone_number,
    thumbnail: contact.thumbnail,
    created_at: contact.created_at,
  });

  if (error) {
    console.error("Error inserting contact:", error);
    throw error;
  }

  console.log(`Contact ${contact.id} saved successfully`);
}

// Handle conversation status change
async function handleConversationStatusChanged(supabaseClient: any, data: any) {
  const conversation = data.conversation;

  const { error } = await supabaseClient
    .from("chatwoot_conversations")
    .update({
      status: conversation.status,
      agent_id: conversation.assignee?.id,
      updated_at: conversation.updated_at,
    })
    .eq("chatwoot_conversation_id", conversation.id);

  if (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }

  console.log(`Conversation ${conversation.id} status updated to ${conversation.status}`);
}

// Match Chatwoot contact with existing customer by phone
async function matchCustomerByPhone(supabaseClient: any, contact: any) {
  if (!contact.phone_number) return;

  // Clean phone number (remove special characters)
  const cleanPhone = contact.phone_number.replace(/\D/g, "");

  // Try to find customer by whatsapp or phone
  const { data: customers, error } = await supabaseClient
    .from("customers")
    .select("*")
    .or(`whatsapp.ilike.%${cleanPhone}%,phone.ilike.%${cleanPhone}%`);

  if (error) {
    console.error("Error matching customer:", error);
    return;
  }

  if (customers && customers.length > 0) {
    // Link contact to customer
    const customer = customers[0];
    const { error: updateError } = await supabaseClient
      .from("chatwoot_contacts")
      .update({ customer_id: customer.id })
      .eq("chatwoot_contact_id", contact.id);

    if (updateError) {
      console.error("Error linking contact to customer:", updateError);
    } else {
      console.log(`Contact ${contact.id} linked to customer ${customer.id}`);
    }
  }
}
