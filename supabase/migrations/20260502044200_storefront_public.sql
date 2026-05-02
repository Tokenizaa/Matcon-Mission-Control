-- Matcon Commerce Fase 1: Storefront Público + Store Core

-- ============================================
-- TABELA: stores (Loja virtual por tenant)
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    whatsapp_number TEXT,
    description TEXT,
    primary_color TEXT DEFAULT '#3b82f6',
    secondary_color TEXT DEFAULT '#1e40af',
    is_active BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb, -- configurações extras, horário, endereço
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS stores_slug_idx ON public.stores(slug);
CREATE INDEX IF NOT EXISTS stores_tenant_idx ON public.stores(tenant_id);
CREATE INDEX IF NOT EXISTS stores_active_idx ON public.stores(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- Tenant pode gerenciar sua própria loja
CREATE POLICY "Tenant manage own store" ON public.stores
    FOR ALL USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

-- Público pode ver lojas ativas (para storefront)
CREATE POLICY "Public view active stores" ON public.stores
    FOR SELECT USING (is_active = true AND is_public = true);

-- Trigger updated_at
CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- ============================================
-- TABELA: store_analytics (Analytics da loja)
-- ============================================
CREATE TABLE IF NOT EXISTS public.store_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- store_viewed, product_viewed, cart_created, quote_requested
    session_id TEXT,
    ip_hash TEXT, -- hash do IP para privacidade
    referrer TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_analytics_store_idx ON public.store_analytics(store_id);
CREATE INDEX IF NOT EXISTS store_analytics_event_idx ON public.store_analytics(event_type);
CREATE INDEX IF NOT EXISTS store_analytics_created_idx ON public.store_analytics(created_at);

-- RLS: Apenas tenant dono pode ver analytics
ALTER TABLE public.store_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant view own analytics" ON public.store_analytics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = store_analytics.store_id 
            AND stores.tenant_id = auth.uid()
        )
    );

-- ============================================
-- TABELA: store_cart_sessions (Carrinhos de visitantes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.store_cart_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{product_id, quantity, unit_price}]
    customer_name TEXT,
    customer_whatsapp TEXT,
    status TEXT DEFAULT 'active', -- active, converted, abandoned
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS store_cart_sessions_store_idx ON public.store_cart_sessions(store_id);
CREATE INDEX IF NOT EXISTS store_cart_sessions_session_idx ON public.store_cart_sessions(session_id);

ALTER TABLE public.store_cart_sessions ENABLE ROW LEVEL SECURITY;

-- Público pode criar/ver carrinhos por session_id
CREATE POLICY "Public cart access by session" ON public.store_cart_sessions
    FOR SELECT USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.stores 
            WHERE stores.id = store_cart_sessions.store_id 
            AND stores.is_active = true
        )
    );

-- ============================================
-- FUNÇÕES AUXILIARES
-- ============================================

-- Função para criar loja automaticamente ao criar profile
CREATE OR REPLACE FUNCTION public.handle_new_store()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- Cria loja com slug baseado no business_name ou id
    INSERT INTO public.stores (tenant_id, slug, name, whatsapp_number)
    VALUES (
        NEW.id,
        COALESCE(
            LOWER(REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9]', '', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 6),
            'loja-' || SUBSTRING(NEW.id::text, 1, 8)
        ),
        COALESCE(NEW.business_name, 'Minha Loja'),
        NULL
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name;
    RETURN NEW;
END;
$$;

-- Trigger opcional: descomentar para criar loja automaticamente
-- CREATE TRIGGER on_profile_created_store 
--     AFTER INSERT ON public.profiles
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_store();

-- ============================================
-- VIEWS PARA DASHBOARD
-- ============================================

-- View de estatísticas da loja
CREATE OR REPLACE VIEW public.store_stats AS
SELECT 
    s.id as store_id,
    s.tenant_id,
    s.name as store_name,
    s.slug,
    s.is_active,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.event_type = 'store_viewed' AND sa.created_at > now() - interval '30 days') as views_30d,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.event_type = 'cart_created' AND sa.created_at > now() - interval '30 days') as carts_30d,
    COUNT(DISTINCT sa.id) FILTER (WHERE sa.event_type = 'quote_requested' AND sa.created_at > now() - interval '30 days') as quotes_30d,
    COUNT(DISTINCT scs.id) FILTER (WHERE scs.status = 'active') as active_carts,
    MAX(sa.created_at) as last_activity
FROM public.stores s
LEFT JOIN public.store_analytics sa ON sa.store_id = s.id
LEFT JOIN public.store_cart_sessions scs ON scs.store_id = s.id
GROUP BY s.id, s.tenant_id, s.name, s.slug, s.is_active;

-- RLS na view
ALTER VIEW public.store_stats OWNER TO postgres;

COMMENT ON TABLE public.stores IS 'Loja virtual pública de cada tenant';
COMMENT ON TABLE public.store_analytics IS 'Eventos de analytics das lojas públicas';
COMMENT ON TABLE public.store_cart_sessions IS 'Carrinhos de visitantes em lojas públicas';
