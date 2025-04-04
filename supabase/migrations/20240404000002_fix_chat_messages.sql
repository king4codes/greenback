-- Drop existing chat messages table and related objects
drop function if exists public.initialize_chat_table cascade;
drop table if exists public.chat_messages cascade;

-- Create chat messages table with correct structure
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    room_name text not null,
    content text not null,
    user_id uuid references auth.users(id) not null,
    display_name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_chat_messages_room_name on public.chat_messages(room_name);
create index if not exists idx_chat_messages_created_at on public.chat_messages(created_at);
create index if not exists idx_chat_messages_user_id on public.chat_messages(user_id);

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Create policies
create policy "Users can read all chat messages"
    on public.chat_messages for select
    to authenticated
    using (true);

create policy "Users can insert their own messages"
    on public.chat_messages for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Create or replace the initialize function
create or replace function public.initialize_chat_table()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Add table to realtime publication if not already added
    if not exists (
        select 1 
        from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'chat_messages'
    ) then
        -- Create publication if it doesn't exist
        if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
            create publication supabase_realtime;
        end if;
        
        alter publication supabase_realtime add table public.chat_messages;
    end if;
end;
$$; 