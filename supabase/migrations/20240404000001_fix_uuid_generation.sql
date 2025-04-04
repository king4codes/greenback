-- Update user_achievements table to use gen_random_uuid()
alter table if exists public.user_achievements 
    alter column id set default gen_random_uuid();

-- Update daily_checkins table to use gen_random_uuid()
alter table if exists public.daily_checkins 
    alter column id set default gen_random_uuid();

-- Update chat_messages table to use gen_random_uuid()
alter table if exists public.chat_messages 
    alter column id set default gen_random_uuid();

-- Update any existing sequences to use gen_random_uuid()
do $$
declare
    table_record record;
begin
    for table_record in 
        select 
            t.tablename as table_name,
            a.attname as column_name
        from 
            pg_tables t
            join pg_attribute a on a.attrelid = t.tablename::regclass
            join pg_attrdef d on d.adrelid = t.tablename::regclass and d.adnum = a.attnum
        where 
            t.schemaname = 'public'
            and a.atttypid = 'uuid'::regtype
            and pg_get_expr(d.adbin, d.adrelid) like '%uuid%'
            and pg_get_expr(d.adbin, d.adrelid) != 'gen_random_uuid()'
    loop
        execute format(
            'alter table %I alter column %I set default gen_random_uuid()',
            table_record.table_name,
            table_record.column_name
        );
    end loop;
end $$; 