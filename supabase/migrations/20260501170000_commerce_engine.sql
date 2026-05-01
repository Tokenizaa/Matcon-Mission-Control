-- Commerce Engine Layer: Categories & Carts

CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Update products to support categories and more commerce fields
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES auth.users(id),
    customer_id UUID REFERENCES public.customers(id),
    status TEXT DEFAULT 'active', -- active, abandoned, converted, expired
    metadata JSONB DEFAULT '{}'::jsonb, -- UTMs, device info
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES public.carts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    quantity DECIMAL NOT NULL DEFAULT 1,
    unit_price DECIMAL NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant access" ON public.categories FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.carts FOR ALL USING (auth.uid() = tenant_id);
CREATE POLICY "Tenant access" ON public.cart_items FOR ALL USING (
    EXISTS (SELECT 1 FROM public.carts WHERE carts.id = cart_items.cart_id AND carts.tenant_id = auth.uid())
);

-- Trigger for carts updated_at
CREATE TRIGGER update_carts_updated_at 
BEFORE UPDATE ON public.carts 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
