-- Create clients table for customer management
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  instagram text,
  birthday date,
  points integer default 0,
  total_purchases decimal(10,2) default 0,
  last_purchase_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.clients enable row level security;

-- Create policies for clients
create policy "clients_select_own"
  on public.clients for select
  using (auth.uid() = user_id);

create policy "clients_insert_own"
  on public.clients for insert
  with check (auth.uid() = user_id);

create policy "clients_update_own"
  on public.clients for update
  using (auth.uid() = user_id);

create policy "clients_delete_own"
  on public.clients for delete
  using (auth.uid() = user_id);

-- Create index for better performance
create index if not exists clients_user_id_idx on public.clients(user_id);
create index if not exists clients_email_idx on public.clients(email);
create index if not exists clients_phone_idx on public.clients(phone);
