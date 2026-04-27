-- Enable Realtime for the relevant tables
begin;
  -- remove any existing configuration
  drop publication if exists supabase_realtime;
  
  -- create new publication
  create publication supabase_realtime for table chats, messages, notifications;
commit;

-- Ensure replica identity is set to FULL for accurate real-time updates
ALTER TABLE chats REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
