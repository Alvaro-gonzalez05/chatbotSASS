-- Enable pg_net extension for HTTP requests in database functions
-- This is required for webhook notifications and HTTP POST functions

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Verify extension is installed
SELECT 
  name, 
  installed_version,
  comment 
FROM pg_available_extensions 
WHERE name = 'pg_net';