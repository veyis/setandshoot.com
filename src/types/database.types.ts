export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      site_meta: {
        Row: {
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      booking_inquiries: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          organization: string | null;
          message: string;
          locale: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          organization?: string | null;
          message: string;
          locale?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          organization?: string | null;
          message?: string;
          locale?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
