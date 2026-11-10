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
  public: {
    Tables: {
      favorites: {
        Row: {
          event_ref: string
          saved: boolean
          updated_at: number
          user_id: string
        }
        Insert: {
          event_ref: string
          saved: boolean
          updated_at: number
          user_id: string
        }
        Update: {
          event_ref?: string
          saved?: boolean
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
      network_action_log: {
        Row: {
          created_at: string
          id: string
          kind: string
          target_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          target_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          target_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      network_blocks: {
        Row: {
          created_at: string
          owner_id: string
          target_id: string
        }
        Insert: {
          created_at?: string
          owner_id: string
          target_id: string
        }
        Update: {
          created_at?: string
          owner_id?: string
          target_id?: string
        }
        Relationships: []
      }
      network_consents: {
        Row: {
          created_at: string
          granted: boolean
          id: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          id?: string
          user_id: string
          version: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          id?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      network_match_prefs: {
        Row: {
          linkedin: string
          offering: string[]
          seeking: string[]
          share_schedule: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          linkedin?: string
          offering?: string[]
          seeking?: string[]
          share_schedule?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          linkedin?: string
          offering?: string[]
          seeking?: string[]
          share_schedule?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "network_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      network_profiles: {
        Row: {
          days: string[]
          interests: string[]
          name: string
          offering: string
          organization: string
          role: string
          seeking: string
          suspended: boolean
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          days?: string[]
          interests?: string[]
          name?: string
          offering?: string
          organization?: string
          role?: string
          seeking?: string
          suspended?: boolean
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          days?: string[]
          interests?: string[]
          name?: string
          offering?: string
          organization?: string
          role?: string
          seeking?: string
          suspended?: boolean
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: []
      }
      network_reports: {
        Row: {
          created_at: string
          decision: string | null
          id: string
          moderator_id: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          snapshot: string
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          decision?: string | null
          id?: string
          moderator_id?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          snapshot: string
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          decision?: string | null
          id?: string
          moderator_id?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          snapshot?: string
          status?: string
          target_id?: string
        }
        Relationships: []
      }
      network_requests: {
        Row: {
          created_at: string
          id: string
          introduction: string
          recipient_id: string
          recipient_seen: string | null
          sender_id: string
          sender_seen: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          introduction: string
          recipient_id: string
          recipient_seen?: string | null
          sender_id: string
          sender_seen?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          introduction?: string
          recipient_id?: string
          recipient_seen?: string | null
          sender_id?: string
          sender_seen?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      network_suspensions: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_testers: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          consent_version: string
          email: string
          subscribed: boolean
          updated_at: number
          user_id: string
        }
        Insert: {
          consent_version: string
          email: string
          subscribed: boolean
          updated_at: number
          user_id: string
        }
        Update: {
          consent_version?: string
          email?: string
          subscribed?: boolean
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
      organizer_accounts: {
        Row: {
          active: boolean
          aliases: string[]
          created_at: string
          email: string
          expires_at: string
          must_change_password: boolean
          organizer_name: string
          package_tier: string
          slug: string | null
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          aliases?: string[]
          created_at?: string
          email: string
          expires_at?: string
          must_change_password?: boolean
          organizer_name: string
          package_tier?: string
          slug?: string | null
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          aliases?: string[]
          created_at?: string
          email?: string
          expires_at?: string
          must_change_password?: boolean
          organizer_name?: string
          package_tier?: string
          slug?: string | null
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_articles: {
        Row: {
          body: string
          created_at: string
          event_ref: string
          id: string
          image_key: string
          lead: string
          organizer_user_id: string
          status: string
          subjects: string[]
          title: string
          updated_at: string
        }
        Insert: {
          body?: string
          created_at?: string
          event_ref: string
          id?: string
          image_key?: string
          lead?: string
          organizer_user_id: string
          status?: string
          subjects?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          event_ref?: string
          id?: string
          image_key?: string
          lead?: string
          organizer_user_id?: string
          status?: string
          subjects?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizer_event_links: {
        Row: {
          created_at: string
          event_ref: string
          mode: string
          organizer_user_id: string
        }
        Insert: {
          created_at?: string
          event_ref: string
          mode: string
          organizer_user_id: string
        }
        Update: {
          created_at?: string
          event_ref?: string
          mode?: string
          organizer_user_id?: string
        }
        Relationships: []
      }
      organizer_featured_events: {
        Row: {
          created_at: string
          event_ref: string
          organizer_user_id: string
        }
        Insert: {
          created_at?: string
          event_ref: string
          organizer_user_id: string
        }
        Update: {
          created_at?: string
          event_ref?: string
          organizer_user_id?: string
        }
        Relationships: []
      }
      organizer_profiles: {
        Row: {
          data: Json
          slug: string
          updated_at: number
        }
        Insert: {
          data: Json
          slug: string
          updated_at: number
        }
        Update: {
          data?: Json
          slug?: string
          updated_at?: number
        }
        Relationships: []
      }
      role_grants_by_email: {
        Row: {
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      week_profiles: {
        Row: {
          data: Json
          scope: string
          updated_at: number
          user_id: string
        }
        Insert: {
          data: Json
          scope?: string
          updated_at: number
          user_id: string
        }
        Update: {
          data?: Json
          scope?: string
          updated_at?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string; user_uuid: string }
        Returns: boolean
      }
      has_organizer_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      network_allowed: { Args: { u: string }; Returns: boolean }
      network_command: {
        Args: { action: string; payload: Json }
        Returns: Json
      }
      network_linkedin_data: {
        Args: { targets: string[] }
        Returns: {
          linkedin: string
          user_id: string
        }[]
      }
      network_match_data: {
        Args: { targets: string[] }
        Returns: {
          offering: string[]
          seeking: string[]
          shared_events: string[]
          user_id: string
        }[]
      }
      network_pair_allowed: { Args: { a: string; b: string }; Returns: boolean }
      network_set_linkedin: { Args: { url: string }; Returns: Json }
      network_set_match: {
        Args: { offering: string[]; seeking: string[]; share_schedule: boolean }
        Returns: Json
      }
      organizer_quota: { Args: { _user_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "organizer"
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
  public: {
    Enums: {
      app_role: ["admin", "organizer"],
    },
  },
} as const
