-- Create WhatsApp Business API integration table
CREATE TABLE IF NOT EXISTS whatsapp_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  
  -- WhatsApp Business API Configuration
  phone_number_id TEXT NOT NULL, -- Phone number ID from Meta Business
  access_token TEXT NOT NULL, -- Permanent access token
  webhook_verify_token TEXT NOT NULL, -- Token for webhook verification
  business_account_id TEXT NOT NULL, -- WhatsApp Business Account ID
  
  -- Configuration
  webhook_url TEXT, -- Generated webhook URL for this integration
  is_active BOOLEAN DEFAULT false,
  
  -- Status and validation
  is_verified BOOLEAN DEFAULT false,
  webhook_verified_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one integration per bot
  UNIQUE(bot_id)
);

-- Create RLS policies
ALTER TABLE whatsapp_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own WhatsApp integrations
CREATE POLICY "Users can view own whatsapp integrations" ON whatsapp_integrations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create WhatsApp integrations for their own bots
CREATE POLICY "Users can create whatsapp integrations" ON whatsapp_integrations
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    EXISTS (SELECT 1 FROM bots WHERE bots.id = bot_id AND bots.user_id = auth.uid())
  );

-- Users can update their own WhatsApp integrations
CREATE POLICY "Users can update own whatsapp integrations" ON whatsapp_integrations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own WhatsApp integrations
CREATE POLICY "Users can delete own whatsapp integrations" ON whatsapp_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_whatsapp_integrations_updated_at_trigger
  BEFORE UPDATE ON whatsapp_integrations
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_integrations_updated_at();

-- Create table for WhatsApp message logs
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID REFERENCES whatsapp_integrations(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  
  -- WhatsApp message data
  whatsapp_message_id TEXT NOT NULL, -- WhatsApp's message ID
  sender_phone TEXT NOT NULL, -- Phone number of sender
  recipient_phone TEXT NOT NULL, -- Phone number of recipient
  
  -- Message content
  message_type TEXT NOT NULL, -- text, image, document, etc.
  message_content JSONB NOT NULL, -- Full message content from WhatsApp
  
  -- Direction and status
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  
  -- Timestamps
  whatsapp_timestamp BIGINT, -- Timestamp from WhatsApp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Index for performance
  UNIQUE(whatsapp_message_id)
);

-- Create RLS policies for WhatsApp messages
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see messages from their integrations
CREATE POLICY "Users can view own whatsapp messages" ON whatsapp_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM whatsapp_integrations 
      WHERE whatsapp_integrations.id = integration_id 
      AND whatsapp_integrations.user_id = auth.uid()
    )
  );

-- Users can create messages for their integrations
CREATE POLICY "Users can create whatsapp messages" ON whatsapp_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM whatsapp_integrations 
      WHERE whatsapp_integrations.id = integration_id 
      AND whatsapp_integrations.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_user_id ON whatsapp_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_bot_id ON whatsapp_integrations(bot_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_integrations_phone_number_id ON whatsapp_integrations(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_integration_id ON whatsapp_messages(integration_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sender_phone ON whatsapp_messages(sender_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_whatsapp_message_id ON whatsapp_messages(whatsapp_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at ON whatsapp_messages(created_at DESC);