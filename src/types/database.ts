export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type OrganizationType = 'ministry' | 'parastatal' | 'private_company' | 'municipality'

export type TenderStatus =
  | 'identified'
  | 'evaluating'
  | 'preparing'
  | 'submitted'
  | 'bid_opening'
  | 'under_evaluation'
  | 'won'
  | 'lost'
  | 'abandoned'

export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export type ReminderType = 'deadline_7days' | 'deadline_3days' | 'deadline_1day' | 'check_bid_opening'

export type SubscriptionPlan = 'free' | 'pro' | 'team'

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'

export interface Database {
  public: {
    Tables: {
      user_companies: {
        Row: {
          id: string
          name: string
          registration_number: string | null
          vat_number: string | null
          contact_email: string
          contact_phone: string
          address: string | null
          logo_url: string | null
          is_active: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number?: string | null
          vat_number?: string | null
          contact_email: string
          contact_phone: string
          address?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string | null
          vat_number?: string | null
          contact_email?: string
          contact_phone?: string
          address?: string | null
          logo_url?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_company_members: {
        Row: {
          id: string
          user_company_id: string
          user_id: string
          role: MemberRole
          created_at: string
        }
        Insert: {
          id?: string
          user_company_id: string
          user_id: string
          role: MemberRole
          created_at?: string
        }
        Update: {
          id?: string
          user_company_id?: string
          user_id?: string
          role?: MemberRole
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_company_members_user_company_id_fkey'
            columns: ['user_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          }
        ]
      }
      organizations: {
        Row: {
          id: string
          name: string
          type: OrganizationType
          contact_email: string | null
          contact_phone: string | null
          shared: boolean
          created_by_company_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: OrganizationType
          contact_email?: string | null
          contact_phone?: string | null
          shared?: boolean
          created_by_company_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: OrganizationType
          contact_email?: string | null
          contact_phone?: string | null
          shared?: boolean
          created_by_company_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'organizations_created_by_company_id_fkey'
            columns: ['created_by_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          }
        ]
      }
      tender_categories: {
        Row: {
          id: string
          name: string
          user_company_id: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          user_company_id?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          user_company_id?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tender_categories_user_company_id_fkey'
            columns: ['user_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          }
        ]
      }
      tenders: {
        Row: {
          id: string
          user_company_id: string
          organization_id: string
          title: string
          description: string | null
          category_id: string | null
          due_date: string
          document_url: string | null
          status: TenderStatus
          applied: boolean
          applied_date: string | null
          our_bid_amount: number | null
          priority_score: number | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          user_company_id: string
          organization_id: string
          title: string
          description?: string | null
          category_id?: string | null
          due_date: string
          document_url?: string | null
          status?: TenderStatus
          applied?: boolean
          applied_date?: string | null
          our_bid_amount?: number | null
          priority_score?: number | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          user_company_id?: string
          organization_id?: string
          title?: string
          description?: string | null
          category_id?: string | null
          due_date?: string
          document_url?: string | null
          status?: TenderStatus
          applied?: boolean
          applied_date?: string | null
          our_bid_amount?: number | null
          priority_score?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'tenders_user_company_id_fkey'
            columns: ['user_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tenders_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'tenders_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'tender_categories'
            referencedColumns: ['id']
          }
        ]
      }
      bid_opening_results: {
        Row: {
          id: string
          tender_id: string
          opening_date: string
          our_bid_amount: number
          lowest_bid_amount: number
          is_lowest_bidder: boolean
          winner_company_name: string | null
          total_bidders: number
          all_bids_data: Json | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tender_id: string
          opening_date: string
          our_bid_amount: number
          lowest_bid_amount: number
          is_lowest_bidder: boolean
          winner_company_name?: string | null
          total_bidders: number
          all_bids_data?: Json | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tender_id?: string
          opening_date?: string
          our_bid_amount?: number
          lowest_bid_amount?: number
          is_lowest_bidder?: boolean
          winner_company_name?: string | null
          total_bidders?: number
          all_bids_data?: Json | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'bid_opening_results_tender_id_fkey'
            columns: ['tender_id']
            referencedRelation: 'tenders'
            referencedColumns: ['id']
          }
        ]
      }
      competitors: {
        Row: {
          id: string
          user_company_id: string | null
          name: string
          specialty_areas: string[] | null
          notes: string | null
          encounter_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_company_id?: string | null
          name: string
          specialty_areas?: string[] | null
          notes?: string | null
          encounter_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_company_id?: string | null
          name?: string
          specialty_areas?: string[] | null
          notes?: string | null
          encounter_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'competitors_user_company_id_fkey'
            columns: ['user_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          }
        ]
      }
      competitive_bids: {
        Row: {
          id: string
          tender_id: string
          competitor_id: string
          bid_amount: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tender_id: string
          competitor_id: string
          bid_amount: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tender_id?: string
          competitor_id?: string
          bid_amount?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'competitive_bids_tender_id_fkey'
            columns: ['tender_id']
            referencedRelation: 'tenders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'competitive_bids_competitor_id_fkey'
            columns: ['competitor_id']
            referencedRelation: 'competitors'
            referencedColumns: ['id']
          }
        ]
      }
      procurement_plans: {
        Row: {
          id: string
          user_company_id: string | null
          organization_id: string
          fiscal_year: string
          revision_number: number
          file_url: string | null
          upload_date: string
          notes: string | null
          created_by: string
        }
        Insert: {
          id?: string
          user_company_id?: string | null
          organization_id: string
          fiscal_year: string
          revision_number?: number
          file_url?: string | null
          upload_date?: string
          notes?: string | null
          created_by: string
        }
        Update: {
          id?: string
          user_company_id?: string | null
          organization_id?: string
          fiscal_year?: string
          revision_number?: number
          file_url?: string | null
          upload_date?: string
          notes?: string | null
          created_by?: string
        }
        Relationships: [
          {
            foreignKeyName: 'procurement_plans_user_company_id_fkey'
            columns: ['user_company_id']
            referencedRelation: 'user_companies'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'procurement_plans_organization_id_fkey'
            columns: ['organization_id']
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          }
        ]
      }
      reminders: {
        Row: {
          id: string
          tender_id: string
          reminder_type: ReminderType
          scheduled_date: string
          sent: boolean
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tender_id: string
          reminder_type: ReminderType
          scheduled_date: string
          sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tender_id?: string
          reminder_type?: ReminderType
          scheduled_date?: string
          sent?: boolean
          sent_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reminders_tender_id_fkey'
            columns: ['tender_id']
            referencedRelation: 'tenders'
            referencedColumns: ['id']
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          plan: SubscriptionPlan
          status: SubscriptionStatus
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          stripe_price_id?: string | null
          plan?: SubscriptionPlan
          status?: SubscriptionStatus
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
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
      organization_type: OrganizationType
      tender_status: TenderStatus
      member_role: MemberRole
      reminder_type: ReminderType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier use
export type UserCompany = Database['public']['Tables']['user_companies']['Row']
export type UserCompanyInsert = Database['public']['Tables']['user_companies']['Insert']
export type UserCompanyUpdate = Database['public']['Tables']['user_companies']['Update']

export type UserCompanyMember = Database['public']['Tables']['user_company_members']['Row']
export type UserCompanyMemberInsert = Database['public']['Tables']['user_company_members']['Insert']

export type Organization = Database['public']['Tables']['organizations']['Row']
export type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
export type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']

export type TenderCategory = Database['public']['Tables']['tender_categories']['Row']
export type TenderCategoryInsert = Database['public']['Tables']['tender_categories']['Insert']

export type Tender = Database['public']['Tables']['tenders']['Row']
export type TenderInsert = Database['public']['Tables']['tenders']['Insert']
export type TenderUpdate = Database['public']['Tables']['tenders']['Update']

export type BidOpeningResult = Database['public']['Tables']['bid_opening_results']['Row']
export type BidOpeningResultInsert = Database['public']['Tables']['bid_opening_results']['Insert']

export type Competitor = Database['public']['Tables']['competitors']['Row']
export type CompetitorInsert = Database['public']['Tables']['competitors']['Insert']
export type CompetitorUpdate = Database['public']['Tables']['competitors']['Update']

export type CompetitiveBid = Database['public']['Tables']['competitive_bids']['Row']
export type CompetitiveBidInsert = Database['public']['Tables']['competitive_bids']['Insert']

export type ProcurementPlan = Database['public']['Tables']['procurement_plans']['Row']
export type ProcurementPlanInsert = Database['public']['Tables']['procurement_plans']['Insert']

export type Reminder = Database['public']['Tables']['reminders']['Row']
export type ReminderInsert = Database['public']['Tables']['reminders']['Insert']

export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']
export type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']

// Extended types with relations
export type TenderWithRelations = Tender & {
  organization: Organization
  category: TenderCategory | null
  bid_opening_results: BidOpeningResult[]
}

export type UserCompanyWithRole = UserCompany & {
  role: MemberRole
}
