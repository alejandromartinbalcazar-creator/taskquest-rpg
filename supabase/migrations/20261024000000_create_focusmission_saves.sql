create table public.focusmission_saves (
  user_id uuid primary key references auth.users (id) on delete cascade,
  save_data jsonb not null,
  schema_version integer not null default 1,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.focusmission_saves enable row level security;

revoke all on table public.focusmission_saves from anon;
grant select, insert, update, delete on table public.focusmission_saves to authenticated;

create policy "Players can read their own save"
  on public.focusmission_saves for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Players can create their own save"
  on public.focusmission_saves for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players can update their own save"
  on public.focusmission_saves for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players can delete their own save"
  on public.focusmission_saves for delete
  to authenticated
  using ((select auth.uid()) = user_id);
