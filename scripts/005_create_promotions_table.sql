-- Create promotions table
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed_amount', 'points')),
  discount_value decimal(10,2) not null,
  points_required integer default 0,
  min_purchase_amount decimal(10,2) default 0,
  max_uses integer,
  current_uses integer default 0,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.promotions enable row level security;

-- Create policies for promotions
create policy "promotions_select_own"
  on public.promotions for select
  using (auth.uid() = user_id);

create policy "promotions_insert_own"
  on public.promotions for insert
  with check (auth.uid() = user_id);

create policy "promotions_update_own"
  on public.promotions for update
  using (auth.uid() = user_id);

create policy "promotions_delete_own"
  on public.promotions for delete
  using (auth.uid() = user_id);

-- Create rewards table
create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  points_cost integer not null,
  reward_type text not null check (reward_type in ('discount', 'free_item', 'service', 'gift')),
  reward_value text, -- JSON or text describing the reward
  stock_quantity integer,
  current_stock integer,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for rewards
alter table public.rewards enable row level security;

-- Create policies for rewards
create policy "rewards_select_own"
  on public.rewards for select
  using (auth.uid() = user_id);

create policy "rewards_insert_own"
  on public.rewards for insert
  with check (auth.uid() = user_id);

create policy "rewards_update_own"
  on public.rewards for update
  using (auth.uid() = user_id);

create policy "rewards_delete_own"
  on public.rewards for delete
  using (auth.uid() = user_id);

-- Create points transactions table
create table if not exists public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  transaction_type text not null check (transaction_type in ('earned', 'redeemed', 'expired', 'adjusted')),
  points_amount integer not null,
  description text,
  reference_id uuid, -- Can reference promotion_id, reward_id, etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for points transactions
alter table public.points_transactions enable row level security;

-- Create policies for points transactions
create policy "points_transactions_select_own"
  on public.points_transactions for select
  using (auth.uid() = user_id);

create policy "points_transactions_insert_own"
  on public.points_transactions for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists promotions_user_id_idx on public.promotions(user_id);
create index if not exists promotions_active_idx on public.promotions(is_active);
create index if not exists rewards_user_id_idx on public.rewards(user_id);
create index if not exists points_transactions_user_id_idx on public.points_transactions(user_id);
create index if not exists points_transactions_client_id_idx on public.points_transactions(client_id);
