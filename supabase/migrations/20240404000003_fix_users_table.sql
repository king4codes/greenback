-- Drop existing users table if it exists
drop table if exists public.users cascade;

-- Create users table with correct structure
create table if not exists public.users (
    id uuid references auth.users(id) primary key,
    display_name text,
    avatar_url text,
    level integer default 1,
    total_points integer default 0,
    created_at timestamptz default now() not null,
    last_login timestamptz default now(),
    is_admin boolean default false
);

-- Create indexes
create index if not exists idx_users_display_name on public.users(display_name);

-- Enable RLS
alter table public.users enable row level security;

-- Create policies
create policy "Users can read their own profile"
    on public.users for select
    to authenticated
    using (auth.uid() = id);

create policy "Users can update their own profile"
    on public.users for update
    to authenticated
    using (auth.uid() = id);

create policy "Users can insert their own profile"
    on public.users for insert
    to authenticated
    with check (auth.uid() = id);

-- Create function to ensure user profile exists
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.users (id, display_name, created_at)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous'), now())
    on conflict (id) do nothing;
    return new;
end;
$$;

-- Create trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user(); 