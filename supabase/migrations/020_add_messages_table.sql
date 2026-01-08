-- Migration: Add messages table for Circle messaging feature
-- This table stores messages sent by visitors to card owners

-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_whatsapp TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('bermitra', 'produk', 'jasa', 'investasi', 'lainnya')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own messages
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT USING (recipient_id = auth.uid());

-- Policy: Anyone can send messages (insert)
CREATE POLICY "Anyone can send messages" ON public.messages
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update their own messages (mark as read)
CREATE POLICY "Users can update own messages" ON public.messages
    FOR UPDATE USING (recipient_id = auth.uid());

-- Policy: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (recipient_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE public.messages IS 'Stores messages sent to business card owners from Circle network';
COMMENT ON COLUMN public.messages.purpose IS 'Purpose of message: bermitra, produk, jasa, investasi, lainnya';
