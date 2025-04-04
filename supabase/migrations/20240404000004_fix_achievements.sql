-- Drop existing tables if they exist
drop table if exists public.user_achievements cascade;
drop table if exists public.achievements cascade;

-- Create achievements table
create table if not exists public.achievements (
    id text primary key,
    name text not null,
    description text not null,
    icon text not null,
    rank text not null check (rank in ('basic', 'uncommon', 'rare', 'epic', 'legendary')),
    points integer not null default 0,
    requires_progress boolean default false,
    total_required integer,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Create user achievements table
create table if not exists public.user_achievements (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    achievement_id text references public.achievements(id) on delete cascade not null,
    progress integer default 0,
    earned_at timestamptz default null,
    created_at timestamptz default now() not null,
    unique(user_id, achievement_id)
);

-- Create indexes
create index if not exists idx_user_achievements_user_id on public.user_achievements(user_id);
create index if not exists idx_user_achievements_achievement_id on public.user_achievements(achievement_id);

-- Enable RLS
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Create policies
create policy "Anyone can read achievements"
    on public.achievements for select
    using (true);

create policy "Users can read their own achievements"
    on public.user_achievements for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert their own achievements"
    on public.user_achievements for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update their own achievements"
    on public.user_achievements for update
    to authenticated
    using (user_id = auth.uid());

-- Insert initial achievements
insert into public.achievements (id, name, description, icon, rank, points, requires_progress, total_required)
values
    ('early-adopter', 'Early Adopter', 'Joined during beta phase', '🌟', 'rare', 250, false, null),
    ('daily-streak-7', 'Weekly Warrior', 'Log in for 7 consecutive days', '📅', 'uncommon', 150, true, 7),
    ('daily-streak-30', 'Monthly Master', 'Log in for 30 consecutive days', '📆', 'rare', 300, true, 30),
    ('daily-streak-365', 'Year-Long Legend', 'Log in for 365 consecutive days', '🏆', 'legendary', 1000, true, 365),
    ('artist', 'Digital Artist', 'Create artwork in the Draw section', '🎨', 'basic', 75, false, null)
on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    rank = excluded.rank,
    points = excluded.points,
    requires_progress = excluded.requires_progress,
    total_required = excluded.total_required,
    updated_at = now(); 