-- ==========================================
-- SKINBRIDGE SUPABASE DATABASE SCHEMA SETUP
-- ==========================================

-- 1. Table: shares_roblox (Roblox clothing shares)
create table if not exists shares_roblox (
  slug text primary key,
  skin_url text not null,
  shirt_url text not null,
  pants_url text not null,
  preview_url text,
  arm_type text not null check (arm_type in ('steve', 'alex')),
  creator_name text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on shares_roblox
alter table shares_roblox enable row level security;

-- Policies for shares_roblox
create policy "Permitir lectura publica en shares_roblox" 
  on shares_roblox for select 
  using (true);

create policy "shares_roblox_insert_v3" 
  on shares_roblox for insert 
  with check (slug is not null);


-- 2. Table: shares_head3d (3D Head shares)
create table if not exists shares_head3d (
  slug text primary key,
  preview_url text not null,
  skin_url text not null,
  face_urls jsonb not null,
  creator_name text,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on shares_head3d
alter table shares_head3d enable row level security;

-- Policies for shares_head3d
create policy "Permitir lectura publica en shares_head3d" 
  on shares_head3d for select 
  using (true);

create policy "shares_head3d_insert_v3" 
  on shares_head3d for insert 
  with check (slug is not null);


-- 3. Table: rate_limits (Server-side IP rate limiting)
create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  workspace text not null check (workspace in ('roblox', 'head3d')),
  created_at timestamptz not null default now()
);

-- Composite index for quick rate limit evaluations
create index if not exists idx_rate_limits_ip_workspace_time
  on rate_limits (ip, workspace, created_at desc);

-- Enable RLS on rate_limits (no public policies, accessible only via service_role by Edge Functions)
alter table rate_limits enable row level security;


-- 4. Unified View: shares_all (Merges shares & filters for last 7 days)
create or replace view shares_all as
select 
  slug,
  creator_name,
  description,
  preview_url,
  created_at,
  'roblox' as type,
  skin_url
from shares_roblox
where created_at >= now() - interval '7 days'
union all
select 
  slug,
  creator_name,
  description,
  preview_url,
  created_at,
  'head3d' as type,
  skin_url
from shares_head3d
where created_at >= now() - interval '7 days';

-- Grant access to the view for anonymous/public users
grant select on table shares_all to anon;
grant select on table shares_all to authenticated;


-- 5. Storage Bucket Setup (Guidelines)
-- Note: Create a public storage bucket named 'conversions' in your Supabase console.
-- Then run the following policy to allow anonymous uploads (INSERT):
--
-- CREATE POLICY "Permitir subida publica a conversions"
-- ON storage.objects
-- FOR INSERT
-- WITH CHECK (bucket_id = 'conversions');


-- 6. Auto-Deletion Cleanup Job (Requires pg_cron extension)
-- Enable pg_cron in Supabase under Database -> Extensions -> pg_cron
create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-expired-shares',
  '0 0 * * *', -- Runs every day at midnight UTC
  $$
    delete from shares_roblox where created_at < now() - interval '7 days';
    delete from shares_head3d where created_at < now() - interval '7 days';
  $$
);

-- 7. Analytics: Global Application Analytics & Usage Trends
create table if not exists app_analytics (
  id text primary key,
  conversions integer default 0,
  exports integer default 0,
  head_usage integer default 0,
  roblox_usage integer default 0,
  blockbench_usage integer default 0,
  formats jsonb default '{"GLB": 0, "BBMODEL": 0, "Shirt": 0, "Pants": 0, "OBJ": 0, "FBX": 0}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table app_analytics enable row level security;

create policy "Permitir lectura publica en app_analytics" 
  on app_analytics for select 
  using (true);

create policy "Permitir insercion publica en app_analytics" 
  on app_analytics for insert 
  with check (true);

create policy "Permitir update publico en app_analytics" 
  on app_analytics for update 
  using (true);


create table if not exists app_activity (
  id text primary key,
  action_key text not null,
  details text not null,
  timestamp bigint not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table app_activity enable row level security;

create policy "Permitir lectura publica en app_activity" 
  on app_activity for select 
  using (true);

create policy "Permitir insercion publica en app_activity" 
  on app_activity for insert 
  with check (true);


-- RPC function to increment global analytics atomically
create or replace function increment_analytics(
  col_name text,
  format_name text default null
) returns void as $$
begin
  -- Initialize global row if it doesn't exist
  insert into app_analytics (id, conversions, exports, head_usage, roblox_usage, blockbench_usage, formats)
  values ('global', 0, 0, 0, 0, 0, '{"GLB": 0, "BBMODEL": 0, "Shirt": 0, "Pants": 0, "OBJ": 0, "FBX": 0}'::jsonb)
  on conflict (id) do nothing;

  if col_name = 'conversions' then
    update app_analytics set conversions = conversions + 1 where id = 'global';
  elsif col_name = 'exports' then
    update app_analytics set exports = exports + 1 where id = 'global';
  elsif col_name = 'head_usage' then
    update app_analytics set head_usage = head_usage + 1 where id = 'global';
  elsif col_name = 'roblox_usage' then
    update app_analytics set roblox_usage = roblox_usage + 1 where id = 'global';
  elsif col_name = 'blockbench_usage' then
    update app_analytics set blockbench_usage = blockbench_usage + 1 where id = 'global';
  end if;

  if format_name is not null then
    update app_analytics 
    set formats = jsonb_set(
      formats, 
      array[format_name], 
      to_jsonb(coalesce((formats->>format_name)::int, 0) + 1)
    )
    where id = 'global';
  end if;
end;
$$ language plpgsql;

-- Grant execute permissions to public/anonymous roles for the RPC function
grant execute on function increment_analytics(text, text) to anon;
grant execute on function increment_analytics(text, text) to authenticated;

