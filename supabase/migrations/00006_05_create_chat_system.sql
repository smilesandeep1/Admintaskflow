/*
# Create Chat System

## Overview
This migration creates the internal chat system for the TaskFlow Hub application.
Users can chat individually, by section, or by level within their assigned sections.

## Tables Created

### 1. chat_messages
Stores all chat messages in the system.

**Columns:**
- `id` (uuid, primary key) - Unique message identifier
- `sender_id` (uuid, references profiles.id) - User who sent the message
- `chat_type` (enum: 'individual', 'section', 'level') - Type of chat
- `recipient_id` (uuid, nullable, references profiles.id) - For individual chats
- `chat_group` (text, nullable) - Section name or level (L1, L2, L3, L4) for group chats
- `message` (text, not null) - Message content
- `is_read` (boolean, default false) - Whether message has been read
- `created_at` (timestamptz, default now()) - Message timestamp

**Indexes:**
- Index on sender_id for fast sender queries
- Index on recipient_id for fast recipient queries
- Index on chat_type for filtering by type
- Index on chat_group for group chat queries
- Index on created_at for chronological ordering
- Composite index on (recipient_id, is_read) for unread message counts

## Security
- Enable RLS on chat_messages table
- Users can view messages where they are sender or recipient
- Users can view section messages for their assigned sections
- Users can view level messages for their level
- Users can only insert messages as themselves
- Users can update only the is_read status of messages they received

## Notes
- Messages are ordered by created_at for chronological display
- Unread messages can be efficiently queried using the composite index
- Section-based chats are restricted to users within those sections
- Level-based chats are restricted to users of that level
*/

-- Create chat_type enum
CREATE TYPE chat_type AS ENUM ('individual', 'section', 'level');

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chat_type chat_type NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  chat_group text,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_individual_chat CHECK (
    (chat_type = 'individual' AND recipient_id IS NOT NULL AND chat_group IS NULL) OR
    (chat_type != 'individual')
  ),
  CONSTRAINT valid_group_chat CHECK (
    (chat_type IN ('section', 'level') AND chat_group IS NOT NULL AND recipient_id IS NULL) OR
    (chat_type = 'individual')
  )
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient ON chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_chat_type ON chat_messages(chat_type);
CREATE INDEX idx_chat_messages_chat_group ON chat_messages(chat_group);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_unread ON chat_messages(recipient_id, is_read) WHERE recipient_id IS NOT NULL;

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages they sent
CREATE POLICY "Users can view sent messages" ON chat_messages
  FOR SELECT
  USING (auth.uid() = sender_id);

-- Policy: Users can view individual messages sent to them
CREATE POLICY "Users can view received individual messages" ON chat_messages
  FOR SELECT
  USING (
    chat_type = 'individual' AND 
    auth.uid() = recipient_id
  );

-- Policy: Users can view section messages for their sections
CREATE POLICY "Users can view section messages" ON chat_messages
  FOR SELECT
  USING (
    chat_type = 'section' AND
    chat_group IN (
      SELECT unnest(sections) FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can view level messages for their level
CREATE POLICY "Users can view level messages" ON chat_messages
  FOR SELECT
  USING (
    chat_type = 'level' AND
    chat_group = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Policy: Users can insert messages as themselves
CREATE POLICY "Users can send messages" ON chat_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Policy: Users can mark received messages as read
CREATE POLICY "Users can mark messages as read" ON chat_messages
  FOR UPDATE
  USING (
    auth.uid() = recipient_id OR
    (chat_type = 'section' AND chat_group IN (
      SELECT unnest(sections) FROM profiles WHERE id = auth.uid()
    )) OR
    (chat_type = 'level' AND chat_group = (SELECT role FROM profiles WHERE id = auth.uid()))
  )
  WITH CHECK (
    -- Only allow updating is_read field
    is_read IS DISTINCT FROM OLD.is_read AND
    sender_id = OLD.sender_id AND
    chat_type = OLD.chat_type AND
    recipient_id IS NOT DISTINCT FROM OLD.recipient_id AND
    chat_group IS NOT DISTINCT FROM OLD.chat_group AND
    message = OLD.message AND
    created_at = OLD.created_at
  );

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_chat_count(user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM chat_messages
  WHERE (
    (chat_type = 'individual' AND recipient_id = user_id AND is_read = false) OR
    (chat_type = 'section' AND is_read = false AND sender_id != user_id AND chat_group IN (
      SELECT unnest(sections) FROM profiles WHERE id = user_id
    )) OR
    (chat_type = 'level' AND is_read = false AND sender_id != user_id AND chat_group = (
      SELECT role FROM profiles WHERE id = user_id
    ))
  );
$$;