-- MATCON PRODUCT COMMERCE ENGINE
-- Reestruturação completa do cadastro de produtos
-- Criado: 2026-05-02

-- ============================================
-- TABELA: product_images (Galeria de Imagens)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    storage_path TEXT,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    source_type TEXT DEFAULT 'upload',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS product_images_tenant_idx ON public.product_images(tenant_id);
CREATE INDEX IF NOT EXISTS product_images_primary_idx ON public.product_images(product_id) WHERE is_primary = true;

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_product_images_updated_at ON public.product_images;
CREATE TRIGGER update_product_images_updated_at
    BEFORE UPDATE ON public.product_images
    FOR EACH ROW EXECUTE PROCEDURE public.touch_updated_at();

-- RLS Policies
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant manage own product images" ON public.product_images;
CREATE POLICY "Tenant manage own product images" ON public.product_images
    FOR ALL USING (auth.uid() = tenant_id) WITH CHECK (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Public read product images from active stores" ON public.product_images;
CREATE POLICY "Public read product images from active stores" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.stores s ON s.tenant_id = p.tenant_id
            WHERE p.id = product_images.product_id
            AND s.is_active = true 
            AND s.is_public = true
        )
    );

COMMENT ON TABLE public.product_images IS 'Galeria de imagens dos produtos - múltiplas imagens com ordenação';

-- ============================================
-- TABELA: product_events (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_events_product_idx ON public.product_events(product_id);
CREATE INDEX IF NOT EXISTS product_events_type_idx ON public.product_events(event_type);
CREATE INDEX IF NOT EXISTS product_events_created_idx ON public.product_events(created_at);

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant view own product events" ON public.product_events;
CREATE POLICY "Tenant view own product events" ON public.product_events
    FOR SELECT USING (auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Allow anonymous product event insert" ON public.product_events;
CREATE POLICY "Allow anonymous product event insert" ON public.product_events
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.product_events IS 'Eventos de produto: view, share, cart_add, etc';

-- ============================================
-- FUNÇÃO: Gerar slug automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_product_slug()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug = LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || SUBSTRING(NEW.id::text, 1, 6);
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger para gerar slug
DROP TRIGGER IF EXISTS set_product_slug ON public.products;
CREATE TRIGGER set_product_slug
    BEFORE INSERT ON public.products
    FOR EACH ROW EXECUTE PROCEDURE public.handle_product_slug();

-- ============================================
-- VIEW: Produtos com imagem principal
-- ============================================
DROP VIEW IF EXISTS public.products_with_images;
CREATE OR REPLACE VIEW public.products_with_images AS
SELECT 
    p.*,
    pi.image_url as primary_image_url,
    pi.alt_text as primary_image_alt,
    (SELECT COUNT(*) FROM public.product_images WHERE product_id = p.id) as image_count
FROM public.products p
LEFT JOIN public.product_images pi ON pi.product_id = p.id AND pi.is_primary = true;

ALTER VIEW public.products_with_images OWNER TO postgres;

COMMENT ON VIEW public.products_with_images IS 'Produtos com imagem principal e contagem de imagens';

-- ============================================
-- BUCKET: product-images (Storage)
-- ============================================
-- Nota: Criar via Supabase Dashboard ou CLI:
-- supabase storage create product-images --public
