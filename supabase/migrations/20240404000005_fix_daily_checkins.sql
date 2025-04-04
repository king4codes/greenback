-- Drop existing daily_checkins table and related objects
drop table if exists public.daily_checkins cascade;

-- Create daily_checkins table with correct structure
create table if not exists public.daily_checkins (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    check_in_date date not null,
    streak_count integer default 1,
    points_earned integer default 10,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    unique(user_id, check_in_date)
);

-- Create indexes
create index if not exists idx_daily_checkins_user_id on public.daily_checkins(user_id);
create index if not exists idx_daily_checkins_check_in_date on public.daily_checkins(check_in_date);

-- Enable RLS
alter table public.daily_checkins enable row level security;

-- Create policies
create policy "Users can read their own check-ins"
    on public.daily_checkins for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert their own check-ins"
    on public.daily_checkins for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update their own check-ins"
    on public.daily_checkins for update
    to authenticated
    using (user_id = auth.uid()); 