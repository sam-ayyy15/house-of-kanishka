export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          city: string
          clerk_user_id: string
          country: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          line1: string
          line2: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
        }
        Insert: {
          city: string
          clerk_user_id: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          is_default?: boolean
          line1: string
          line2?: string | null
          phone: string
          pincode: string
          state: string
          updated_at?: string
        }
        Update: {
          city?: string
          clerk_user_id?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          line1?: string
          line2?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_clerk_user_id_fkey"
            columns: ["clerk_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["clerk_user_id"]
          },
        ]
      }
      bag_items: {
        Row: {
          clerk_user_id: string
          qty: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          clerk_user_id: string
          qty: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          clerk_user_id?: string
          qty?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bag_items_clerk_user_id_fkey"
            columns: ["clerk_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["clerk_user_id"]
          },
          {
            foreignKeyName: "bag_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          launch_state: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          launch_state?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          launch_state?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_slug: string
          position: number
          product_id: string
        }
        Insert: {
          collection_slug: string
          position?: number
          product_id: string
        }
        Update: {
          collection_slug?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_slug_fkey"
            columns: ["collection_slug"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          eyebrow: string
          hero: Json
          intro: string
          slug: string
          sort_order: number
          status: string
          title: string[]
          updated_at: string
        }
        Insert: {
          eyebrow: string
          hero: Json
          intro?: string
          slug: string
          sort_order?: number
          status?: string
          title: string[]
          updated_at?: string
        }
        Update: {
          eyebrow?: string
          hero?: Json
          intro?: string
          slug?: string
          sort_order?: number
          status?: string
          title?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      consent_log: {
        Row: {
          clerk_user_id: string | null
          created_at: string
          email: string | null
          granted: boolean
          id: number
          kind: string
          source: string
        }
        Insert: {
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          granted: boolean
          id?: never
          kind: string
          source: string
        }
        Update: {
          clerk_user_id?: string | null
          created_at?: string
          email?: string | null
          granted?: boolean
          id?: never
          kind?: string
          source?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          order_number: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          order_number?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          order_number?: string | null
          status?: string
        }
        Relationships: []
      }
      curated_lists: {
        Row: {
          key: string
          product_slugs: string[]
          updated_at: string
        }
        Insert: {
          key: string
          product_slugs?: string[]
          updated_at?: string
        }
        Update: {
          key?: string
          product_slugs?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      error_log: {
        Row: {
          created_at: string
          digest: string | null
          id: number
          kind: string | null
          message: string
          path: string
        }
        Insert: {
          created_at?: string
          digest?: string | null
          id?: never
          kind?: string | null
          message: string
          path: string
        }
        Update: {
          created_at?: string
          digest?: string | null
          id?: never
          kind?: string | null
          message?: string
          path?: string
        }
        Relationships: []
      }
      launch_waitlist: {
        Row: {
          category_slug: string
          created_at: string
          email: string
          id: string
          notified_at: string | null
        }
        Insert: {
          category_slug: string
          created_at?: string
          email: string
          id?: string
          notified_at?: string | null
        }
        Update: {
          category_slug?: string
          created_at?: string
          email?: string
          id?: string
          notified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_waitlist_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      look_hotspots: {
        Row: {
          id: string
          look_id: string
          product_id: string
          x: number
          y: number
        }
        Insert: {
          id?: string
          look_id: string
          product_id: string
          x: number
          y: number
        }
        Update: {
          id?: string
          look_id?: string
          product_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "look_hotspots_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "look_hotspots_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      looks: {
        Row: {
          alt: string
          copy: string
          height: number
          id: string
          image: string
          number: string
          sort_order: number
          span: number
          title: string[]
          updated_at: string
          width: number
        }
        Insert: {
          alt?: string
          copy?: string
          height: number
          id: string
          image: string
          number: string
          sort_order?: number
          span?: number
          title: string[]
          updated_at?: string
          width: number
        }
        Update: {
          alt?: string
          copy?: string
          height?: number
          id?: string
          image?: string
          number?: string
          sort_order?: number
          span?: number
          title?: string[]
          updated_at?: string
          width?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          source: string
          status: string
          token: string
          unsubscribed_at: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          source?: string
          status?: string
          token?: string
          unsubscribed_at?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          source?: string
          status?: string
          token?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          colour: string | null
          id: string
          image: string | null
          name: string
          order_id: string
          product_slug: string
          qty: number
          size: string
          unit_price_inr: number
          variant_id: string | null
        }
        Insert: {
          colour?: string | null
          id?: string
          image?: string | null
          name: string
          order_id: string
          product_slug: string
          qty: number
          size: string
          unit_price_inr: number
          variant_id?: string | null
        }
        Update: {
          colour?: string | null
          id?: string
          image?: string | null
          name?: string
          order_id?: string
          product_slug?: string
          qty?: number
          size?: string
          unit_price_inr?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string
          admin_note: string | null
          cancelled_at: string | null
          clerk_user_id: string | null
          cod_confirm_token: string
          confirm_email_sent_at: string | null
          confirmed_at: string | null
          courier: string | null
          delivered_at: string | null
          email: string
          hold_expires_at: string | null
          id: string
          needs_attention: string | null
          number: string
          packed_at: string | null
          paid_at: string | null
          payment_method: string
          payment_status: string
          phone: string
          placed_at: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_refund_id: string | null
          refunded_at: string | null
          ship_to: Json
          shipped_at: string | null
          shipping_inr: number
          status: string
          stock_held: boolean
          subtotal_inr: number
          total_inr: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string
          admin_note?: string | null
          cancelled_at?: string | null
          clerk_user_id?: string | null
          cod_confirm_token?: string
          confirm_email_sent_at?: string | null
          confirmed_at?: string | null
          courier?: string | null
          delivered_at?: string | null
          email: string
          hold_expires_at?: string | null
          id?: string
          needs_attention?: string | null
          number: string
          packed_at?: string | null
          paid_at?: string | null
          payment_method: string
          payment_status?: string
          phone: string
          placed_at?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_refund_id?: string | null
          refunded_at?: string | null
          ship_to: Json
          shipped_at?: string | null
          shipping_inr: number
          status: string
          stock_held?: boolean
          subtotal_inr: number
          total_inr: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          admin_note?: string | null
          cancelled_at?: string | null
          clerk_user_id?: string | null
          cod_confirm_token?: string
          confirm_email_sent_at?: string | null
          confirmed_at?: string | null
          courier?: string | null
          delivered_at?: string | null
          email?: string
          hold_expires_at?: string | null
          id?: string
          needs_attention?: string | null
          number?: string
          packed_at?: string | null
          paid_at?: string | null
          payment_method?: string
          payment_status?: string
          phone?: string
          placed_at?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_refund_id?: string | null
          refunded_at?: string | null
          ship_to?: Json
          shipped_at?: string | null
          shipping_inr?: number
          status?: string
          stock_held?: boolean
          subtotal_inr?: number
          total_inr?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_clerk_user_id_fkey"
            columns: ["clerk_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["clerk_user_id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_id: string
          payload: Json
          razorpay_order_id: string | null
          received_at: string
          type: string
        }
        Insert: {
          event_id: string
          payload: Json
          razorpay_order_id?: string | null
          received_at?: string
          type: string
        }
        Update: {
          event_id?: string
          payload?: Json
          razorpay_order_id?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          colour: string
          id: string
          product_id: string
          size: string
          sku: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          colour: string
          id?: string
          product_id: string
          size: string
          sku: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          colour?: string
          id?: string
          product_id?: string
          size?: string
          sku?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          card: string
          category_slug: string
          colour: string
          colourways: Json | null
          created_at: string
          description: string
          details: string[]
          gallery: Json
          id: string
          image: string
          is_new: boolean
          name: string
          price_inr: number
          slug: string
          sort_order: number
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          card?: string
          category_slug: string
          colour: string
          colourways?: Json | null
          created_at?: string
          description?: string
          details?: string[]
          gallery?: Json
          id?: string
          image: string
          is_new?: boolean
          name: string
          price_inr: number
          slug: string
          sort_order?: number
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          card?: string
          category_slug?: string
          colour?: string
          colourways?: Json | null
          created_at?: string
          description?: string
          details?: string[]
          gallery?: Json
          id?: string
          image?: string
          is_new?: boolean
          name?: string
          price_inr?: number
          slug?: string
          sort_order?: number
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
        ]
      }
      profiles: {
        Row: {
          clerk_user_id: string
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string | null
          last_name: string | null
          marketing_opt_in: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          marketing_opt_in?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          hits: number
          window_start: string
        }
        Insert: {
          bucket: string
          hits?: number
          window_start: string
        }
        Update: {
          bucket?: string
          hits?: number
          window_start?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          clerk_user_id: string
          created_at: string
          product_id: string
        }
        Insert: {
          clerk_user_id: string
          created_at?: string
          product_id: string
        }
        Update: {
          clerk_user_id?: string
          created_at?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_items_clerk_user_id_fkey"
            columns: ["clerk_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["clerk_user_id"]
          },
          {
            foreignKeyName: "wishlist_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clerk_user_id: { Args: never; Returns: string }
      confirm_cod_order: { Args: { p_token: string }; Returns: Json }
      mark_order_paid: {
        Args: { p_payment_id: string; p_razorpay_order_id: string }
        Returns: Json
      }
      place_order: { Args: { p: Json }; Returns: Json }
      rate_limit_hit: {
        Args: { p_bucket: string; p_max_hits: number; p_window_seconds: number }
        Returns: boolean
      }
      release_expired_orders: { Args: never; Returns: number }
      release_order_stock: { Args: { p_order_id: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
