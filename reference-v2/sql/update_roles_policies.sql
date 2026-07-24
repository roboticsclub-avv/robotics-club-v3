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

-- 4.5. CREATE FUNCTION: IT OR TECHNICAL OR ADMIN
create or replace function public.is_it_or_tech_or_admin(user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where uid = user_id and role in ('admin', 'technical', 'it')
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

-- ALLOCATIONS: Read access for staff/admins or the user who owns the allocation
drop policy if exists "Manage allocations policy" on public.allocations;
drop policy if exists "Select allocations policy" on public.allocations;
create policy "Select allocations policy" on public.allocations
for select to authenticated
using (
  public.is_data_or_tech_or_admin(auth.uid()) OR 
  (auth.uid() = "userId")
);

-- ALLOCATIONS: Insert allowed for self-requisition
drop policy if exists "Insert allocations policy" on public.allocations;
create policy "Insert allocations policy" on public.allocations
for insert to authenticated
with check (
  (auth.uid() = "userId")
);

-- ALLOCATIONS: Update allowed for staff or self-return status update
drop policy if exists "Update allocations policy" on public.allocations;
create policy "Update allocations policy" on public.allocations
for update to authenticated
using (
  public.is_data_or_tech_or_admin(auth.uid()) OR 
  (auth.uid() = "userId")
)
with check (
  public.is_data_or_tech_or_admin(auth.uid()) OR 
  (auth.uid() = "userId")
);

-- ALLOCATIONS TRIGGER: Automatically manages hardware availableQuantity counts on insert/return/issue transitions, accounting for allocation quantity
create or replace function public.handle_allocation_stock_change()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    -- Decrement availableQuantity by NEW.quantity only if status starts directly as 'issued'
    if (NEW.status = 'issued') then
      update public.hardware
      set "availableQuantity" = "availableQuantity" - coalesce(NEW.quantity, 1)
      where id = NEW."itemId";
    end if;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    -- If status changes from 'pending' to 'issued', decrement availableQuantity by NEW.quantity
    if (OLD.status = 'pending' and NEW.status = 'issued') then
      update public.hardware
      set "availableQuantity" = "availableQuantity" - coalesce(NEW.quantity, 1)
      where id = NEW."itemId";
    -- If status changes from 'issued' to 'returned', increment availableQuantity by OLD.quantity
    elsif (OLD.status = 'issued' and NEW.status = 'returned') then
      update public.hardware
      set "availableQuantity" = "availableQuantity" + coalesce(OLD.quantity, 1)
      where id = NEW."itemId";
    end if;
    return NEW;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_allocation_change on public.allocations;
create trigger on_allocation_change
after insert or update on public.allocations
for each row execute function public.handle_allocation_stock_change();

-- USERS (Applicants): Deletions managed by Secretary and Admin (cannot delete self)
drop policy if exists "Delete users policy" on public.users;
create policy "Delete users policy" on public.users
for delete to authenticated
using (
  public.is_secretary_or_admin(auth.uid()) AND 
  (auth.uid() <> uid)
);

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

-- =========================================================================
-- CATEGORIES: Table and Policies Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
DROP POLICY IF EXISTS "Allow public select on categories" ON public.categories;
CREATE POLICY "Allow public select on categories" ON public.categories
FOR SELECT USING (true);

-- Allow authenticated admins/staff to manage categories
DROP POLICY IF EXISTS "Allow admin manage on categories" ON public.categories;
CREATE POLICY "Allow admin manage on categories" ON public.categories
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE uid = auth.uid() AND role IN ('admin', 'technical', 'ops', 'data', 'secretary', 'it')
  )
);

-- =========================================================================
-- PROJECTS: Table and Policies Setup
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🤖',
    description TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    link TEXT DEFAULT '#',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Select: Public read access
DROP POLICY IF EXISTS "Allow public select on projects" ON public.projects;
CREATE POLICY "Allow public select on projects" ON public.projects
FOR SELECT USING (true);

-- Manage: Admin, Technical, and IT teams
DROP POLICY IF EXISTS "Allow admin/tech/it manage on projects" ON public.projects;
CREATE POLICY "Allow admin/tech/it manage on projects" ON public.projects
FOR ALL TO authenticated
USING (public.is_it_or_tech_or_admin(auth.uid()));
