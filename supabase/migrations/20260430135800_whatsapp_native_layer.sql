-- WhatsApp & Event Sourcing Layer

CREATE TABLE IF NOT EXISTS public.whatsapp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id),
    type TEXT NOT NULL, -- message_received, audio_received, payment_paid, etc.
    payload JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversation_contexts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id) UNIQUE,
    last_quote_id UUID REFERENCES public.quotes(id),
    last_order_id UUID REFERENCES public.orders(id),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_store (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    aggregate_type TEXT NOT NULL, -- customer, quote, order, payment
    aggregate_id UUID NOT NULL,
    event_type TEXT NOT NULL, -- created, updated, status_changed
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.message_intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id),
    message TEXT NOT NULL,
    intent TEXT, -- quote_request, stock_question, etc.
    confidence FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.xml_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    filename TEXT,
    nfe_key TEXT,
    payload JSONB,
    status TEXT DEFAULT 'pending', -- pending, processed, error
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.whatsapp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xml_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access" ON public.whatsapp_events FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.conversation_contexts FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.event_store FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.message_intents FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.xml_imports FOR ALL USING (auth.uid() = tenant_id);

-- Trigger for conversation_contexts updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_contexts_updated_at 
BEFORE UPDATE ON public.conversation_contexts 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
