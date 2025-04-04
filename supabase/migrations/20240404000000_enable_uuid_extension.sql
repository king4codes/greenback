-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Enable pgcrypto extension for gen_random_uuid() if not already enabled
create extension if not exists "pgcrypto";

-- Verify extensions are enabled
do $$
begin
    if not exists (
        select 1 
        from pg_extension 
        where extname = 'uuid-ossp'
    ) then
        raise exception 'uuid-ossp extension is not enabled';
    end if;

    if not exists (
        select 1 
        from pg_extension 
        where extname = 'pgcrypto'
    ) then
        raise exception 'pgcrypto extension is not enabled';
    end if;
end $$; 