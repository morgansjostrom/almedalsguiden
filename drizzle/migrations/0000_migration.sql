create type public.app_role as enum ('admin', 'organizer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- Pre-approved emails (admin/organizer). Only service role can read; roles are granted to verified emails only.
create table public.role_grants_by_email (
  email text not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (email, role)
);
grant all on public.role_grants_by_email to service_role;
alter table public.role_grants_by_email enable row level security;

create or replace function public.apply_email_role_grants()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.user_roles (user_id, role)
    select new.id, g.role from public.role_grants_by_email g where lower(g.email) = lower(new.email)
    on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_role_grants
after insert or update of email_confirmed_at on auth.users
for each row execute function public.apply_email_role_grants();

create table public.favorites (
  user_id uuid not null,
  event_ref text not null,
  saved boolean not null,
  updated_at bigint not null,
  primary key (user_id, event_ref)
);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "Own favorites select" on public.favorites for select to authenticated using (auth.uid() = user_id);
create policy "Own favorites insert" on public.favorites for insert to authenticated with check (auth.uid() = user_id);
create policy "Own favorites update" on public.favorites for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own favorites delete" on public.favorites for delete to authenticated using (auth.uid() = user_id);

create table public.week_profiles (
  user_id uuid not null,
  scope text not null default 'personal',
  data jsonb not null,
  updated_at bigint not null,
  primary key (user_id, scope)
);
grant select, insert, update, delete on public.week_profiles to authenticated;
grant all on public.week_profiles to service_role;
alter table public.week_profiles enable row level security;
create policy "Own week select" on public.week_profiles for select to authenticated using (auth.uid() = user_id);
create policy "Own week insert" on public.week_profiles for insert to authenticated with check (auth.uid() = user_id);
create policy "Own week update" on public.week_profiles for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own week delete" on public.week_profiles for delete to authenticated using (auth.uid() = user_id);

create table public.newsletter_subscriptions (
  user_id uuid primary key,
  email text not null,
  subscribed boolean not null,
  consent_version text not null,
  updated_at bigint not null
);
grant select, insert, update on public.newsletter_subscriptions to authenticated;
grant all on public.newsletter_subscriptions to service_role;
alter table public.newsletter_subscriptions enable row level security;
create policy "Own newsletter select" on public.newsletter_subscriptions for select to authenticated using (auth.uid() = user_id);
create policy "Own newsletter insert" on public.newsletter_subscriptions for insert to authenticated with check (auth.uid() = user_id);
create policy "Own newsletter update" on public.newsletter_subscriptions for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.organizer_profiles (
  slug text primary key,
  data jsonb not null,
  updated_at bigint not null
);
grant select on public.organizer_profiles to anon;
grant select, insert, update on public.organizer_profiles to authenticated;
grant all on public.organizer_profiles to service_role;
alter table public.organizer_profiles enable row level security;
create policy "Public read organizer profiles" on public.organizer_profiles for select to anon, authenticated using (true);
create policy "Organizers insert profiles" on public.organizer_profiles for insert to authenticated
  with check (public.has_role(auth.uid(), 'organizer') or public.has_role(auth.uid(), 'admin'));
create policy "Organizers update profiles" on public.organizer_profiles for update to authenticated
  using (public.has_role(auth.uid(), 'organizer') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'organizer') or public.has_role(auth.uid(), 'admin'));