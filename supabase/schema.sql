-- Tender Management System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE organization_type AS ENUM ('ministry', 'parastatal', 'private_company', 'municipality');
CREATE TYPE tender_status AS ENUM ('identified', 'evaluating', 'preparing', 'submitted', 'bid_opening', 'under_evaluation', 'won', 'lost', 'abandoned');
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member', 'viewer');
CREATE TYPE reminder_type AS ENUM ('deadline_7days', 'deadline_3days', 'deadline_1day', 'check_bid_opening');

-- User Companies table
CREATE TABLE user_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    registration_number TEXT,
    vat_number TEXT,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    address TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Company Members table
CREATE TABLE user_company_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_company_id UUID NOT NULL REFERENCES user_companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_company_id, user_id)
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    contact_email TEXT,
    contact_phone TEXT,
    shared BOOLEAN DEFAULT true,
    created_by_company_id UUID REFERENCES user_companies(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tender Categories table
CREATE TABLE tender_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    user_company_id UUID REFERENCES user_companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenders table
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_company_id UUID NOT NULL REFERENCES user_companies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES tender_categories(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    document_url TEXT,
    status tender_status DEFAULT 'identified',
    applied BOOLEAN DEFAULT false,
    applied_date TIMESTAMP WITH TIME ZONE,
    our_bid_amount NUMERIC(15, 2),
    priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Bid Opening Results table
CREATE TABLE bid_opening_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    opening_date TIMESTAMP WITH TIME ZONE NOT NULL,
    our_bid_amount NUMERIC(15, 2) NOT NULL,
    lowest_bid_amount NUMERIC(15, 2) NOT NULL,
    is_lowest_bidder BOOLEAN NOT NULL,
    winner_company_name TEXT,
    total_bidders INTEGER NOT NULL,
    all_bids_data JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitors table
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_company_id UUID REFERENCES user_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    specialty_areas TEXT[],
    notes TEXT,
    encounter_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive Bids table
CREATE TABLE competitive_bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    bid_amount NUMERIC(15, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Procurement Plans table
CREATE TABLE procurement_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_company_id UUID REFERENCES user_companies(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fiscal_year TEXT NOT NULL,
    file_url TEXT,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Reminders table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    reminder_type reminder_type NOT NULL,
    scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
    sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_tenders_user_company ON tenders(user_company_id);
CREATE INDEX idx_tenders_due_date ON tenders(due_date);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_organization ON tenders(organization_id);
CREATE INDEX idx_user_company_members_user ON user_company_members(user_id);
CREATE INDEX idx_user_company_members_company ON user_company_members(user_company_id);
CREATE INDEX idx_organizations_shared ON organizations(shared);
CREATE INDEX idx_tender_categories_company ON tender_categories(user_company_id);
CREATE INDEX idx_competitors_company ON competitors(user_company_id);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_date, sent);

-- Function to increment encounter count
CREATE OR REPLACE FUNCTION increment_encounter_count(p_competitor_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE competitors
    SET encounter_count = encounter_count + 1
    WHERE id = p_competitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_opening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitive_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- User Companies policies
CREATE POLICY "Users can view companies they are members of"
ON user_companies FOR SELECT
USING (
    id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create companies"
ON user_companies FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Company owners and admins can update"
ON user_companies FOR UPDATE
USING (
    id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

CREATE POLICY "Company owners can delete"
ON user_companies FOR DELETE
USING (
    id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role = 'owner'
    )
);

-- User Company Members policies
CREATE POLICY "Members can view their company members"
ON user_company_members FOR SELECT
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create member records for themselves"
ON user_company_members FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can manage members"
ON user_company_members FOR DELETE
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Organizations policies
CREATE POLICY "Users can view shared or company organizations"
ON organizations FOR SELECT
USING (
    shared = true OR
    created_by_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create organizations"
ON organizations FOR INSERT
WITH CHECK (
    created_by_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    ) OR created_by_company_id IS NULL
);

CREATE POLICY "Users can update their company organizations"
ON organizations FOR UPDATE
USING (
    created_by_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
);

CREATE POLICY "Users can delete their company organizations"
ON organizations FOR DELETE
USING (
    created_by_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Tender Categories policies
CREATE POLICY "Users can view system and company categories"
ON tender_categories FOR SELECT
USING (
    user_company_id IS NULL OR
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create categories for their companies"
ON tender_categories FOR INSERT
WITH CHECK (
    created_by = auth.uid() AND
    (
        user_company_id IS NULL OR
        user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can delete their company categories"
ON tender_categories FOR DELETE
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
);

-- Tenders policies
CREATE POLICY "Users can view their company tenders"
ON tenders FOR SELECT
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create tenders for their companies"
ON tenders FOR INSERT
WITH CHECK (
    created_by = auth.uid() AND
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their company tenders"
ON tenders FOR UPDATE
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete their company tenders"
ON tenders FOR DELETE
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
);

-- Bid Opening Results policies
CREATE POLICY "Users can view bid results for their company tenders"
ON bid_opening_results FOR SELECT
USING (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create bid results for their company tenders"
ON bid_opening_results FOR INSERT
WITH CHECK (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can delete bid results for their company tenders"
ON bid_opening_results FOR DELETE
USING (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

-- Competitors policies
CREATE POLICY "Users can view shared and company competitors"
ON competitors FOR SELECT
USING (
    user_company_id IS NULL OR
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create competitors"
ON competitors FOR INSERT
WITH CHECK (
    user_company_id IS NULL OR
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can update competitors"
ON competitors FOR UPDATE
USING (
    user_company_id IS NULL OR
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete competitors"
ON competitors FOR DELETE
USING (
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

-- Competitive Bids policies
CREATE POLICY "Users can view competitive bids for their company tenders"
ON competitive_bids FOR SELECT
USING (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create competitive bids"
ON competitive_bids FOR INSERT
WITH CHECK (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

-- Procurement Plans policies
CREATE POLICY "Users can view procurement plans"
ON procurement_plans FOR SELECT
USING (
    user_company_id IS NULL OR
    user_company_id IN (
        SELECT user_company_id FROM user_company_members
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create procurement plans"
ON procurement_plans FOR INSERT
WITH CHECK (
    created_by = auth.uid()
);

-- Reminders policies
CREATE POLICY "Users can view reminders for their company tenders"
ON reminders FOR SELECT
USING (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can create reminders for their company tenders"
ON reminders FOR INSERT
WITH CHECK (
    tender_id IN (
        SELECT id FROM tenders WHERE user_company_id IN (
            SELECT user_company_id FROM user_company_members
            WHERE user_id = auth.uid()
        )
    )
);
