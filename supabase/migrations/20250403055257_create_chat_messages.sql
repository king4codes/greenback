create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_name text not null,
  content text not null,
  user_id uuid references auth.users(id),
  user_name text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create index for faster queries when fetching messages by room
create index if not exists idx_chat_messages_room_name on chat_messages(room_name);

-- Create index for fetching messages in chronological order
create index if not exists idx_chat_messages_created_at on chat_messages(created_at);

-- Enable RLS
alter table chat_messages enable row level security;

-- Allow all authenticated users to read messages
create policy "Allow users to read chat messages"
  on chat_messages for select
  to authenticated
  using (true);

-- Allow users to insert their own messages
create policy "Allow users to insert their own messages"
  on chat_messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Add realtime support
alter publication supabase_realtime add table chat_messages;
