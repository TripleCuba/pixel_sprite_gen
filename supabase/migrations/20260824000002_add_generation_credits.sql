alter table public.app_users
  add column if not exists credit_balance integer not null default 20
  check (credit_balance >= 0);

create table if not exists public.sprite_credit_reservations (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  quality text not null check (quality in ('low', 'medium', 'high')),
  credit_cost integer not null check (credit_cost > 0),
  status text not null default 'reserved'
    check (status in ('reserved', 'completed', 'refunded')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  refunded_at timestamptz
);

create index if not exists sprite_credit_reservations_user_created_at_idx
  on public.sprite_credit_reservations (user_id, created_at desc);

alter table public.sprite_credit_reservations enable row level security;
revoke all on table public.sprite_credit_reservations from anon, authenticated;
grant all on table public.sprite_credit_reservations to service_role;

create or replace function public.reserve_sprite_generation_credits(
  p_email text,
  p_reservation_id uuid,
  p_quality text,
  p_credit_cost integer
)
returns table (credit_balance integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.app_users%rowtype;
begin
  if nullif(trim(p_email), '') is null
    or p_credit_cost <= 0
    or p_quality not in ('low', 'medium', 'high') then
    raise exception 'A valid email, quality, and credit cost are required.';
  end if;

  insert into public.app_users (email)
  values (lower(trim(p_email)))
  on conflict (email) do nothing;

  select *
  into target_user
  from public.app_users
  where email = lower(trim(p_email))
  for update;

  if target_user.credit_balance < p_credit_cost then
    return;
  end if;

  update public.app_users as app_user
  set
    credit_balance = app_user.credit_balance - p_credit_cost,
    updated_at = now()
  where app_user.id = target_user.id;

  insert into public.sprite_credit_reservations (
    id,
    user_id,
    quality,
    credit_cost
  )
  values (
    p_reservation_id,
    target_user.id,
    p_quality,
    p_credit_cost
  );

  return query
  select target_user.credit_balance - p_credit_cost;
end;
$$;

create or replace function public.complete_sprite_generation_credits(
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sprite_credit_reservations
  set
    status = 'completed',
    completed_at = now()
  where id = p_reservation_id and status = 'reserved';
end;
$$;

create or replace function public.refund_sprite_generation_credits(
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reservation public.sprite_credit_reservations%rowtype;
begin
  select *
  into reservation
  from public.sprite_credit_reservations
  where id = p_reservation_id
  for update;

  if not found or reservation.status <> 'reserved' then
    return;
  end if;

  update public.sprite_credit_reservations
  set
    status = 'refunded',
    refunded_at = now()
  where id = reservation.id;

  update public.app_users as app_user
  set
    credit_balance = app_user.credit_balance + reservation.credit_cost,
    updated_at = now()
  where app_user.id = reservation.user_id;
end;
$$;

revoke all on function public.reserve_sprite_generation_credits(text, uuid, text, integer)
  from public, anon, authenticated;
revoke all on function public.complete_sprite_generation_credits(uuid)
  from public, anon, authenticated;
revoke all on function public.refund_sprite_generation_credits(uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_sprite_generation_credits(text, uuid, text, integer)
  to service_role;
grant execute on function public.complete_sprite_generation_credits(uuid)
  to service_role;
grant execute on function public.refund_sprite_generation_credits(uuid)
  to service_role;

notify pgrst, 'reload schema';
