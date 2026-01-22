export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          role: 'FREE_USER' | 'PAID_USER' | 'APP_ADMIN'
          payment_verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role?: 'FREE_USER' | 'PAID_USER' | 'APP_ADMIN'
          payment_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role?: 'FREE_USER' | 'PAID_USER' | 'APP_ADMIN'
          payment_verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_cards: {
        Row: {
          id: string
          user_id: string
          full_name: string
          job_title: string | null
          company: string | null
          email: string
          phone: string
          website: string | null
          profile_photo_url: string | null
          social_links: Json
          is_public: boolean
          visible_fields: Json
          qr_code_url: string | null
          scan_count: number
          created_at: string
          updated_at: string
          address: string | null
          city: string | null
          business_description: string | null
          show_business_description: boolean
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          job_title?: string | null
          company?: string | null
          email: string
          phone: string
          website?: string | null
          profile_photo_url?: string | null
          social_links?: Json
          is_public?: boolean
          visible_fields?: Json
          qr_code_url?: string | null
          scan_count?: number
          created_at?: string
          updated_at?: string
          address?: string | null
          city?: string | null
          business_description?: string | null
          show_business_description?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          job_title?: string | null
          company?: string | null
          email?: string
          phone?: string
          website?: string | null
          profile_photo_url?: string | null
          social_links?: Json
          is_public?: boolean
          visible_fields?: Json
          qr_code_url?: string | null
          scan_count?: number
          created_at?: string
          updated_at?: string
          address?: string | null
          city?: string | null
          business_description?: string | null
          show_business_description?: boolean
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          category: string | null
          owner_id: string
          is_public: boolean
          require_approval: boolean
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          logo_url?: string | null
          category?: string | null
          owner_id: string
          is_public?: boolean
          require_approval?: boolean
          username?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          category?: string | null
          owner_id?: string
          is_public?: boolean
          require_approval?: boolean
          username?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          is_admin: boolean
          joined_at: string | null
          requested_at: string
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          is_admin?: boolean
          joined_at?: string | null
          requested_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          is_admin?: boolean
          joined_at?: string | null
          requested_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }

      }
      user_relationships: {
        Row: {
          id: string
          provider_id: string
          client_id: string
          business_card_id: string
          scanned_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          provider_id: string
          client_id: string
          business_card_id: string
          scanned_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          provider_id?: string
          client_id?: string
          business_card_id?: string
          scanned_at?: string
          notes?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          proof_url: string
          status: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount?: number
          proof_url: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          proof_url?: string
          status?: 'PENDING' | 'APPROVED' | 'REJECTED'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          id: number
          site_title: string
          site_description: string
          keywords: string[] | null
          og_image_google: string | null
          og_image_twitter: string | null
          og_image_facebook: string | null
          og_image_linkedin: string | null
          updated_at: string
        }
        Insert: {
          id?: number
          site_title?: string
          site_description?: string
          keywords?: string[] | null
          og_image_google?: string | null
          og_image_twitter?: string | null
          og_image_facebook?: string | null
          og_image_linkedin?: string | null
          updated_at?: string
        }
        Update: {
          id?: number
          site_title?: string
          site_description?: string
          keywords?: string[] | null
          og_image_google?: string | null
          og_image_twitter?: string | null
          og_image_facebook?: string | null
          og_image_linkedin?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          recipient_id: string
          sender_name: string
          sender_whatsapp: string
          sender_email: string
          purpose: 'bermitra' | 'produk' | 'jasa' | 'investasi' | 'lainnya'
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          sender_name: string
          sender_whatsapp: string
          sender_email: string
          purpose: 'bermitra' | 'produk' | 'jasa' | 'investasi' | 'lainnya'
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          sender_name?: string
          sender_whatsapp?: string
          sender_email?: string
          purpose?: 'bermitra' | 'produk' | 'jasa' | 'investasi' | 'lainnya'
          message?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      ngabsen: {
        Row: {
          id: string
          user_id: string
          nama_acara: string
          deskripsi_acara: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nama_acara: string
          deskripsi_acara?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nama_acara?: string
          deskripsi_acara?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pendaftaran_ngabsen: {
        Row: {
          id: string
          ngabsen_id: string
          nama_peserta: string
          deskripsi: string | null
          email: string
          no_whatsapp: string
          created_at: string
        }
        Insert: {
          id?: string
          ngabsen_id: string
          nama_peserta: string
          deskripsi?: string | null
          email: string
          no_whatsapp: string
          created_at?: string
        }
        Update: {
          id?: string
          ngabsen_id?: string
          nama_peserta?: string
          deskripsi?: string | null
          email?: string
          no_whatsapp?: string
          created_at?: string
        }
        Relationships: []
      }
      link_ngabsen: {
        Row: {
          id: string
          ngabsen_id: string
          user_id: string
          link_pendaftaran: string
          link_daftar_peserta: string
          created_at: string
        }
        Insert: {
          id?: string
          ngabsen_id: string
          user_id: string
          link_pendaftaran: string
          link_daftar_peserta: string
          created_at?: string
        }
        Update: {
          id?: string
          ngabsen_id?: string
          user_id?: string
          link_pendaftaran?: string
          link_daftar_peserta?: string
          created_at?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          invited_by: string
          status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          invited_by: string
          status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          invited_by?: string
          status?: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      template_settings: {
        Row: {
          id: string
          template_id: string
          template_name: string
          access_type: 'free' | 'pro' | 'pin'
          pin_code: string | null
          is_active: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id: string
          template_name: string
          access_type?: 'free' | 'pro' | 'pin'
          pin_code?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          template_name?: string
          access_type?: 'free' | 'pro' | 'pin'
          pin_code?: string | null
          is_active?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      xploit_potential_log: {
        Row: {
          id: string
          ip_address: string | null
          user_agent: string | null
          payload: string | null
          event_type: string
          path: string | null
          user_id: string | null
          severity: 'low' | 'medium' | 'high' | 'critical'
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          payload?: string | null
          event_type: string
          path?: string | null
          user_id?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          payload?: string | null
          event_type?: string
          path?: string | null
          user_id?: string | null
          severity?: 'low' | 'medium' | 'high' | 'critical'
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      circle_broadcasts: {
        Row: {
          id: string
          organization_id: string
          sender_id: string
          message: string
          word_count: number
          recipient_count: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          sender_id: string
          message: string
          word_count: number
          recipient_count: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          sender_id?: string
          message?: string
          word_count?: number
          recipient_count?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'FREE_USER' | 'PAID_USER' | 'APP_ADMIN'
      payment_status: 'PENDING' | 'APPROVED' | 'REJECTED'
      membership_status: 'PENDING' | 'APPROVED' | 'REJECTED'
      invitation_status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}