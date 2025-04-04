-- Create user page visits table
create table if not exists public.user_page_visits (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    page text not null,
    visit_date date not null,
    created_at timestamptz default now(),
    unique(user_id, page, visit_date)
);

-- Create indexes
create index if not exists idx_user_page_visits_user_id on public.user_page_visits(user_id);
create index if not exists idx_user_page_visits_page on public.user_page_visits(page);
create index if not exists idx_user_page_visits_date on public.user_page_visits(visit_date);

-- Enable RLS
alter table public.user_page_visits enable row level security;

-- Create policies
create policy "Users can read their own page visits"
    on public.user_page_visits for select
    to authenticated
    using (user_id = auth.uid());

create policy "Users can insert their own page visits"
    on public.user_page_visits for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can update their own page visits"
    on public.user_page_visits for update
    to authenticated
    using (user_id = auth.uid()); 