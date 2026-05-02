export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          tenant_id: string | null
          user_id: string
          name: string
          slug: string | null
          sku: string | null
          internal_code: string | null
          gtin_ean: string | null
          brand: string | null
          manufacturer: string | null
          category_id: string | null
          subcategory_id: string | null
          department: string | null
          product_line: string | null
          tags: string[] | null
          price: number
          sale_price: number | null
          promotional_price: number | null
          cost_price: number | null
          cost: number | null
          margin: number | null
          markup: number | null
          stock: number | null
          stock_quantity: number | null
          minimum_stock: number | null
          reserved_stock: number | null
          stock_status: string | null
          unit: string | null
          purchase_unit: string | null
          sale_unit: string | null
          sale_multiple: number | null
          short_description: string | null
          full_description: string | null
          technical_specs: Json | null
          application_use: string | null
          benefits: string[] | null
          weight_kg: number | null
          width_cm: number | null
          height_cm: number | null
          length_cm: number | null
          coverage_m2: number | null
          yield_per_unit: string | null
          packaging_type: string | null
          seo_title: string | null
          seo_description: string | null
          canonical_slug: string | null
          semantic_tags: string[] | null
          embedding_ready: boolean | null
          is_active: boolean | null
          is_featured: boolean | null
          visibility: string | null
          images: string[] | null
          image_url: string | null
          attributes: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          user_id: string
          name: string
          slug?: string | null
          sku?: string | null
          internal_code?: string | null
          gtin_ean?: string | null
          brand?: string | null
          manufacturer?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          department?: string | null
          product_line?: string | null
          tags?: string[] | null
          price: number
          sale_price?: number | null
          promotional_price?: number | null
          cost_price?: number | null
          cost?: number | null
          margin?: number | null
          markup?: number | null
          stock?: number | null
          stock_quantity?: number | null
          minimum_stock?: number | null
          reserved_stock?: number | null
          stock_status?: string | null
          unit?: string | null
          purchase_unit?: string | null
          sale_unit?: string | null
          sale_multiple?: number | null
          short_description?: string | null
          full_description?: string | null
          technical_specs?: Json | null
          application_use?: string | null
          benefits?: string[] | null
          weight_kg?: number | null
          width_cm?: number | null
          height_cm?: number | null
          length_cm?: number | null
          coverage_m2?: number | null
          yield_per_unit?: string | null
          packaging_type?: string | null
          seo_title?: string | null
          seo_description?: string | null
          canonical_slug?: string | null
          semantic_tags?: string[] | null
          embedding_ready?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          visibility?: string | null
          images?: string[] | null
          image_url?: string | null
          attributes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          user_id?: string
          name?: string
          slug?: string | null
          sku?: string | null
          internal_code?: string | null
          gtin_ean?: string | null
          brand?: string | null
          manufacturer?: string | null
          category_id?: string | null
          subcategory_id?: string | null
          department?: string | null
          product_line?: string | null
          tags?: string[] | null
          price?: number
          sale_price?: number | null
          promotional_price?: number | null
          cost_price?: number | null
          cost?: number | null
          margin?: number | null
          markup?: number | null
          stock?: number | null
          stock_quantity?: number | null
          minimum_stock?: number | null
          reserved_stock?: number | null
          stock_status?: string | null
          unit?: string | null
          purchase_unit?: string | null
          sale_unit?: string | null
          sale_multiple?: number | null
          short_description?: string | null
          full_description?: string | null
          technical_specs?: Json | null
          application_use?: string | null
          benefits?: string[] | null
          weight_kg?: number | null
          width_cm?: number | null
          height_cm?: number | null
          length_cm?: number | null
          coverage_m2?: number | null
          yield_per_unit?: string | null
          packaging_type?: string | null
          seo_title?: string | null
          seo_description?: string | null
          canonical_slug?: string | null
          semantic_tags?: string[] | null
          embedding_ready?: boolean | null
          is_active?: boolean | null
          is_featured?: boolean | null
          visibility?: string | null
          images?: string[] | null
          image_url?: string | null
          attributes?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          image_url: string
          storage_path: string | null
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          source_type: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          image_url: string
          storage_path?: string | null
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          source_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          image_url?: string
          storage_path?: string | null
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          source_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      product_events: {
        Row: {
          id: string
          tenant_id: string
          product_id: string | null
          event_type: string
          event_data: Json | null
          session_id: string | null
          ip_hash: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id?: string | null
          event_type: string
          event_data?: Json | null
          session_id?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string | null
          event_type?: string
          event_data?: Json | null
          session_id?: string | null
          ip_hash?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      stores: {
        Row: {
          id: string
          tenant_id: string
          slug: string
          name: string
          logo_url: string | null
          banner_url: string | null
          whatsapp_number: string | null
          description: string | null
          primary_color: string
          secondary_color: string
          is_active: boolean
          is_public: boolean
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          tenant_id: string
          slug: string
          name: string
          logo_url?: string | null
          banner_url?: string | null
          whatsapp_number?: string | null
          description?: string | null
          primary_color?: string
          secondary_color?: string
          is_active?: boolean
          is_public?: boolean
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string
          slug?: string
          name?: string
          logo_url?: string | null
          banner_url?: string | null
          whatsapp_number?: string | null
          description?: string | null
          primary_color?: string
          secondary_color?: string
          is_active?: boolean
          is_public?: boolean
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      store_analytics: {
        Row: {
          id: string
          store_id: string | null
          event_type: string
          event_data: Json | null
          session_id: string | null
          referrer: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          store_id?: string | null
          event_type: string
          event_data?: Json | null
          session_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          store_id?: string | null
          event_type?: string
          event_data?: Json | null
          session_id?: string | null
          referrer?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          tenant_id: string | null
          name: string
          slug: string
          description: string | null
          active: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          tenant_id?: string | null
          name: string
          slug: string
          description?: string | null
          active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          tenant_id?: string | null
          name?: string
          slug?: string
          description?: string | null
          active?: boolean | null
          created_at?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          whatsapp: string | null
          address: string | null
          credit_limit: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          credit_limit?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          credit_limit?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          total: number | null
          status: string
          notes: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          total?: number | null
          status?: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string | null
          total?: number | null
          status?: string
          notes?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      quote_items: {
        Row: {
          id: string
          quote_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total: number | null
        }
        Insert: {
          id?: string
          quote_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          total?: number | null
        }
        Update: {
          id?: string
          quote_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          total?: number | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          customer_id: string | null
          total: number | null
          status: string
          payment_status: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id?: string | null
          total?: number | null
          status?: string
          payment_status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string | null
          total?: number | null
          status?: string
          payment_status?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
          total: number | null
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          unit_price: number
          total?: number | null
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
          total?: number | null
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          customer_id: string | null
          amount: number
          method: string | null
          status: string
          pix_code: string | null
          pix_qr_url: string | null
          paid_at: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          customer_id?: string | null
          amount: number
          method?: string | null
          status?: string
          pix_code?: string | null
          pix_qr_url?: string | null
          paid_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          order_id?: string | null
          customer_id?: string | null
          amount?: number
          method?: string | null
          status?: string
          pix_code?: string | null
          pix_qr_url?: string | null
          paid_at?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          business_name: string | null
          phone: string | null
          role: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          business_name?: string | null
          phone?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      products_with_images: {
        Row: {
          id: string | null
          tenant_id: string | null
          name: string | null
          slug: string | null
          sku: string | null
          price: number | null
          sale_price: number | null
          stock: number | null
          is_active: boolean | null
          primary_image_url: string | null
          primary_image_alt: string | null
          image_count: number | null
        }
      }
      store_stats: {
        Row: {
          store_id: string | null
          tenant_id: string | null
          store_name: string | null
          slug: string | null
          is_active: boolean | null
          views_30d: number | null
          carts_30d: number | null
          quotes_30d: number | null
          active_carts: number | null
          last_activity: string | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
