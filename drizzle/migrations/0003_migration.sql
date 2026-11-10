create table public.organizer_accounts (
  user_id uuid primary key,
  email text not null,
  organizer_name text not null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '1 year'),
  must_change_password boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.organizer_accounts to authenticated;
grant all on public.organizer_accounts to service_role;
alter table public.organizer_accounts enable row level security;
create policy "Own organizer account read" on public.organizer_accounts for select to authenticated using (auth.uid() = user_id);
create policy "Admins read organizer accounts" on public.organizer_accounts for select to authenticated using (public.has_role(auth.uid(), 'admin'));

create or replace function public.has_organizer_access(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organizer_accounts where user_id = _user_id and active and starts_at <= now() and expires_at > now())
$$;