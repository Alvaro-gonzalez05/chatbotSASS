-- Create marketing automations table
create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('birthday', 'inactive_client', 'new_promotion')),
  trigger_config jsonb default '{}'::jsonb, -- Configuration for triggers (e.g., days before birthday, inactive days)
  message_template text not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.automations enable row level security;

-- Create policies for automations
create policy "automations_select_own"
  on public.automations for select
  using (auth.uid() = user_id);

create policy "automations_insert_own"
  on public.automations for insert
  with check (auth.uid() = user_id);

create policy "automations_update_own"
  on public.automations for update
  using (auth.uid() = user_id);

create policy "automations_delete_own"
  on public.automations for delete
  using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists automations_user_id_idx on public.automations(user_id);
create index if not exists automations_trigger_type_idx on public.automations(trigger_type);
