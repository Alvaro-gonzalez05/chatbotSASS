-- Create bots configuration table
create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  platform text not null check (platform in ('whatsapp', 'instagram', 'email')),
  personality_prompt text,
  features jsonb default '[]'::jsonb, -- Array of enabled features
  automations jsonb default '[]'::jsonb, -- Array of linked automation IDs
  openai_api_key text,
  is_active boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.bots enable row level security;

-- Create policies for bots
create policy "bots_select_own"
  on public.bots for select
  using (auth.uid() = user_id);

create policy "bots_insert_own"
  on public.bots for insert
  with check (auth.uid() = user_id);

create policy "bots_update_own"
  on public.bots for update
  using (auth.uid() = user_id);

create policy "bots_delete_own"
  on public.bots for delete
  using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists bots_user_id_idx on public.bots(user_id);
create index if not exists bots_platform_idx on public.bots(platform);
