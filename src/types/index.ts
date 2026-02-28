import { Database } from './database.types'

// User type from database
export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

// Business card type
export type BusinessCard = Database['public']['Tables']['business_cards']['Row'] & {
  template?: string
  username?: string
}
export type BusinessCardInsert = Database['public']['Tables']['business_cards']['Insert']
export type BusinessCardUpdate = Database['public']['Tables']['business_cards']['Update']

// Organization type
export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

// Organization member type
export type OrganizationMember = Database['public']['Tables']['organization_members']['Row']
export type OrganizationMemberInsert = Database['public']['Tables']['organization_members']['Insert']
export type OrganizationMemberUpdate = Database['public']['Tables']['organization_members']['Update']

// Organization request type
export interface OrganizationRequest {
  id: string
  organization_id: string
  email: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  message: string | null
  created_at: string
  reviewed_at: string | null
  reviewed_by: string | null
}
export type OrganizationRequestInsert = Omit<OrganizationRequest, 'id' | 'created_at' | 'reviewed_at' | 'reviewed_by'>
export type OrganizationRequestUpdate = Partial<OrganizationRequest>

// User relationship type
export type UserRelationship = Database['public']['Tables']['user_relationships']['Row']
export type UserRelationshipInsert = Database['public']['Tables']['user_relationships']['Insert']

// Payment transaction type
export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']
export type PaymentTransactionInsert = Database['public']['Tables']['payment_transactions']['Insert']
export type PaymentTransactionUpdate = Database['public']['Tables']['payment_transactions']['Update']

// Enum types
export type UserRole = Database['public']['Enums']['user_role']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type MembershipStatus = Database['public']['Enums']['membership_status']

// Auth context type
export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signInWithLinkedIn: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Social links type
export interface SocialLinks {
  linkedin?: string
  twitter?: string
  instagram?: string
  facebook?: string
  github?: string
  website?: string
}

// Visible fields type
export interface VisibleFields {
  email: boolean
  phone: boolean
  website: boolean
  social_links: boolean
  business_description: boolean
}

// API response type
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Form validation error type
export interface FormError {
  field: string
  message: string
}

// Event types
export type EventType = 'online' | 'offline'
export type EventStatus = 'upcoming' | 'past' | 'cancelled'
export type RegistrationStatus = 'confirmed' | 'pending' | 'cancelled'

export interface CircleEvent {
  id: string
  organization_id: string
  created_by: string
  title: string
  description: string | null
  category: string
  event_date: string
  event_time: string
  type: EventType
  status: EventStatus
  location: string | null
  google_map_url: string | null
  zoom_link: string | null
  max_participants: number
  image_url: string | null
  created_at: string
  updated_at: string
}

export type CircleEventInsert = Omit<CircleEvent, 'id' | 'created_at' | 'updated_at'>
export type CircleEventUpdate = Partial<Omit<CircleEvent, 'id' | 'created_at' | 'updated_at'>>

export type EventPaymentProof = Database['public']['Tables']['event_payment_proofs']['Row']
export type EventTicket = Database['public']['Tables']['event_tickets']['Row']
export type EventRsvp = Database['public']['Tables']['event_rsvps']['Row']

export interface EventRegistration {
  id: string
  event_id: string
  user_id: string | null
  name: string
  email: string
  phone: string | null
  institution: string | null
  status: RegistrationStatus
  registered_at: string

  // Relations
  event_payment_proofs?: EventPaymentProof[]
  event_tickets?: EventTicket[]
  event_rsvps?: EventRsvp[]
}

export type EventRegistrationInsert = Omit<EventRegistration, 'id' | 'registered_at' | 'event_payment_proofs' | 'event_tickets' | 'event_rsvps'>