-- players + RLS + trigger + RPC

create table if not exists public.players (
  id uuid primary key default auth.uid()
    references auth.users(id) on delete cascade,
  full_name text not null,
  attempts integer not null default 0,
  high_score integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.players enable row level security;

drop policy if exists "select own row" on public.players;
create policy "select own row" on public.players
for select to authenticated
using (auth.uid() = id);

drop policy if exists "insert own row" on public.players;
create policy "insert own row" on public.players
for insert to authenticated
with check (auth.uid() = id);

drop policy if exists "update own row" on public.players;
create policy "update own row" on public.players
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- (Optional) global select for leaderboard - dostępny dla wszystkich (również niezalogowanych)
drop policy if exists "read leaderboard" on public.players;
create policy "read leaderboard" on public.players
for select to anon, authenticated
using (true);

create or replace function public.increment_attempts()
returns void
language sql
security definer
set search_path = public
as $$
  update public.players
  set attempts = attempts + 1
  where id = auth.uid();
$$;

create or replace function public.submit_score(new_score int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
  set high_score = greatest(high_score, new_score)
  where id = auth.uid();
end;
$$;

grant usage on schema public to authenticated;
grant select, insert, update on public.players to authenticated;
grant execute on function public.increment_attempts() to authenticated;
grant execute on function public.submit_score(int) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players(id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


