-- =========================================================================
-- UPDATE DATABASE SECURITY FUNCTIONS AND POLICIES FOR ROLE-BASED ACCESS CONTROL (RBAC)
-- =========================================================================
-- Run this script in the SQL Editor of your Supabase dashboard to apply the new 
-- role-based access controls for technical, ops, data, and secretary teams.

-- 1. UPDATE MEMBER/ADMIN CHECK FUNCTION
-- This allows all authenticated roles to perform basic reading operations.
create or replace function public.is_member_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('member', 'admin', 'technical', 'ops', 'data', 'secretary')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 2. CREATE FUNCTION: TECHNICAL OR ADMIN
create or replace function public.is_technical_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('admin', 'technical')
  );
 end;
$$ language plpgsql security definer set search_path = public;

-- 3. CREATE FUNCTION: OPS OR ADMIN
create or replace function public.is_ops_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('admin', 'ops')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 4. CREATE FUNCTION: DATA OR TECHNICAL OR ADMIN
create or replace function public.is_data_or_tech_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('admin', 'technical', 'data')
  );
end;
$$ language plpgsql security definer set search_path = public;

-- 5. CREATE FUNCTION: SECRETARY OR ADMIN
create or replace function public.is_secretary_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('admin', 'secretary')
  );
end;
$$ language plpgsql security definer set search_path = public;


-- =========================================================================
-- 6. APPLY UPDATED RLS POLICIES
-- =========================================================================

-- CORE TEAM: Managed by Admin and Technical team
drop policy if exists "Manage core_team policy" on public.core_team;
create policy "Manage core_team policy" on public.core_team
for all to authenticated
using (public.is_technical_or_admin(auth.uid()));

-- EVENTS: Managed by Admin and Ops team
drop policy if exists "Manage events policy" on public.events;
create policy "Manage events policy" on public.events
for all to authenticated
using (public.is_ops_or_admin(auth.uid()));

-- HARDWARE: Managed by Admin, Technical, and Data teams
drop policy if exists "Manage hardware policy" on public.hardware;
create policy "Manage hardware policy" on public.hardware
for all to authenticated
using (public.is_data_or_tech_or_admin(auth.uid()));

-- ALLOCATIONS: Managed by Admin, Technical, and Data teams
drop policy if exists "Manage allocations policy" on public.allocations;
create policy "Manage allocations policy" on public.allocations
for all to authenticated
using (public.is_data_or_tech_or_admin(auth.uid()));

-- USERS (Applicants): Deletions managed by Secretary and Admin
drop policy if exists "Delete users policy" on public.users;
create policy "Delete users policy" on public.users
for delete to authenticated
using (public.is_secretary_or_admin(auth.uid()));

-- USERS (Applicants): Status updates managed by Secretary and Admin
drop policy if exists "Update users policy" on public.users;
create policy "Update users policy" on public.users
for update to authenticated
using (
  (auth.uid() = uid) OR 
  public.is_secretary_or_admin(auth.uid())
)
with check (
  (auth.uid() = uid and (role is null or role = 'applicant')) OR 
  public.is_secretary_or_admin(auth.uid())
);

-- USERS (Applicants): Profile creation allowed for self-signup
drop policy if exists "Insert own profile policy" on public.users;
create policy "Insert own profile policy" on public.users
for insert to authenticated
with check (auth.uid() = uid);
