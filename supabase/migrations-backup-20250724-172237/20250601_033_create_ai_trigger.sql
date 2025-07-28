-- Enable pg_net extension if not already enabled
create extension if not exists pg_net;

-- Create function to notify AI processor when visitor sends a message
create or replace function notify_ai_needed()
returns trigger as $$
begin
  if NEW.sender_type = 'visitor' then
    perform net.http_post(
      url := current_setting('app.supabase_functions_url') || '/ai-processor',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
      ),
      body := jsonb_build_object(
         'conversation_id', NEW.conversation_id,
         'user_msg', NEW.content
      )::text
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger on messages table
drop trigger if exists t_ai_message_processor on messages;
create trigger t_ai_message_processor 
  after insert on messages
  for each row 
  execute procedure notify_ai_needed();

-- Add configuration for the function URLs (to be set during deployment)
-- These will be set via: ALTER DATABASE campfire SET app.supabase_functions_url = 'https://xxx.supabase.co/functions/v1';
-- And: ALTER DATABASE campfire SET app.supabase_service_role_key = 'xxx';