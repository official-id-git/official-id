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
        }
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
          created_at?: string
          updated_at?: string
        }
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
    }
  }
}