-- Update user profiles table to support business information
alter table public.profiles 
add column if not exists business_info jsonb default '{}'::jsonb;

-- Update the table to use consistent naming with the component
alter table public.profiles rename to user_profiles;

-- Update RLS policies for the renamed table
drop policy if exists "profiles_select_own" on public.user_profiles;
drop policy if exists "profiles_insert_own" on public.user_profiles;
drop policy if exists "profiles_update_own" on public.user_profiles;
drop policy if exists "profiles_delete_own" on public.user_profiles;

-- Recreate policies with correct table name
create policy "user_profiles_select_own"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  with check (auth.uid() = id);

create policy "user_profiles_update_own"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "user_profiles_delete_own"
  on public.user_profiles for delete
  using (auth.uid() = id);

-- Update the trigger function to use the new table name
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, business_name, business_info)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'business_name', 'Mi Negocio'),
    '{}'::jsonb
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
