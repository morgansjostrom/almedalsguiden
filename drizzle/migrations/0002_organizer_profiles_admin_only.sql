drop policy "Organizers insert profiles" on public.organizer_profiles;
drop policy "Organizers update profiles" on public.organizer_profiles;
create policy "Admins insert organizer profiles" on public.organizer_profiles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admins update organizer profiles" on public.organizer_profiles for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));