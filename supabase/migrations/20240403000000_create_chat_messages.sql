-- Drop existing table and policies if they exist
drop policy if exists "Users can read all chat messages" on public.chat_messages;
drop policy if exists "Users can insert their own messages" on public.chat_messages;
drop table if exists public.chat_messages;

-- Create table if it doesn't exist
create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    room_name text not null,
    content text not null,
    user_id uuid references auth.users(id) not null,
    user_name text not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create indexes if they don't exist
do $$
begin
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'chat_messages' and indexname = 'idx_chat_messages_room_name') then
        create index idx_chat_messages_room_name on public.chat_messages(room_name);
    end if;
    if not exists (select 1 from pg_indexes where schemaname = 'public' and tablename = 'chat_messages' and indexname = 'idx_chat_messages_created_at') then
        create index idx_chat_messages_created_at on public.chat_messages(created_at);
    end if;
end $$;

-- Enable RLS
alter table public.chat_messages enable row level security;

-- Create policies (dropping first if they exist)
drop policy if exists "Users can read all chat messages" on public.chat_messages;
drop policy if exists "Users can insert their own messages" on public.chat_messages;

create policy "Users can read all chat messages"
    on public.chat_messages
    for select
    to authenticated
    using (true);

create policy "Users can insert their own messages"
    on public.chat_messages
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Enable realtime
do $$
begin
    if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
        create publication supabase_realtime;
    end if;

    if not exists (
        select 1 
        from pg_publication_tables 
        where pubname = 'supabase_realtime' 
        and schemaname = 'public' 
        and tablename = 'chat_messages'
    ) then
        alter publication supabase_realtime add table public.chat_messages;
    end if;
end $$; 