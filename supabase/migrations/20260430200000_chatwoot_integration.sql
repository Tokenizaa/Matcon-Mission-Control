-- Chatwoot Integration Tables

-- Chatwoot Contacts
CREATE TABLE public.chatwoot_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatwoot_contact_id BIGINT NOT NULL UNIQUE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  phone_number TEXT,
  thumbnail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatwoot_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatwoot contacts read" ON public.chatwoot_contacts FOR SELECT USING (true);
CREATE POLICY "chatwoot contacts insert" ON public.chatwoot_contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "chatwoot contacts update" ON public.chatwoot_contacts FOR UPDATE USING (true);

-- Chatwoot Conversations
CREATE TABLE public.chatwoot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatwoot_conversation_id BIGINT NOT NULL UNIQUE,
  chatwoot_contact_id BIGINT NOT NULL,
  inbox_id BIGINT,
  status TEXT NOT NULL DEFAULT 'open',
  agent_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatwoot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatwoot conversations read" ON public.chatwoot_conversations FOR SELECT USING (true);
CREATE POLICY "chatwoot conversations insert" ON public.chatwoot_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "chatwoot conversations update" ON public.chatwoot_conversations FOR UPDATE USING (true);

-- Chatwoot Messages
CREATE TABLE public.chatwoot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatwoot_message_id BIGINT NOT NULL UNIQUE,
  chatwoot_conversation_id BIGINT NOT NULL,
  chatwoot_contact_id BIGINT NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'outgoing',
  sender_type TEXT NOT NULL DEFAULT 'agent',
  status TEXT NOT NULL DEFAULT 'sent',
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chatwoot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chatwoot messages read" ON public.chatwoot_messages FOR SELECT USING (true);
CREATE POLICY "chatwoot messages insert" ON public.chatwoot_messages FOR INSERT WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_chatwoot_contacts_chatwoot_id ON public.chatwoot_contacts(chatwoot_contact_id);
CREATE INDEX idx_chatwoot_contacts_customer_id ON public.chatwoot_contacts(customer_id);
CREATE INDEX idx_chatwoot_conversations_chatwoot_id ON public.chatwoot_conversations(chatwoot_conversation_id);
CREATE INDEX idx_chatwoot_conversations_contact_id ON public.chatwoot_conversations(chatwoot_contact_id);
CREATE INDEX idx_chatwoot_messages_conversation_id ON public.chatwoot_messages(chatwoot_conversation_id);
CREATE INDEX idx_chatwoot_messages_contact_id ON public.chatwoot_messages(chatwoot_contact_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_chatwoot_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER chatwoot_contacts_updated_at BEFORE UPDATE ON public.chatwoot_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_chatwoot_updated_at();

CREATE TRIGGER chatwoot_conversations_updated_at BEFORE UPDATE ON public.chatwoot_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_chatwoot_updated_at();
