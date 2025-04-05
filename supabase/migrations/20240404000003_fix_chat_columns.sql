-- Rename user_name to display_name if it exists
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = 'chat_messages'
        and column_name = 'user_name'
    ) then
        alter table public.chat_messages rename column user_name to display_name;
    end if;
end $$;

-- Add display_name column if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
        and table_name = 'chat_messages'
        and column_name = 'display_name'
    ) then
        alter table public.chat_messages add column display_name text not null;
    end if;
end $$;

-- Create index on display_name if it doesn't exist
do $$
begin
    if not exists (
        select 1
        from pg_indexes
        where schemaname = 'public'
        and tablename = 'chat_messages'
        and indexname = 'idx_chat_messages_display_name'
    ) then
        create index idx_chat_messages_display_name on public.chat_messages(display_name);
    end if;
end $$; 