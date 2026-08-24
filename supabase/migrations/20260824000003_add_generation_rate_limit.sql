create index if not exists sprite_credit_reservations_user_status_created_at_idx
  on public.sprite_credit_reservations (user_id, status, created_at desc);

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
  active_generation_count integer;
  generation_count integer;
  stale_credit_total integer;
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

  select coalesce(sum(credit_cost), 0)
  into stale_credit_total
  from public.sprite_credit_reservations
  where user_id = target_user.id
    and status = 'reserved'
    and created_at < now() - interval '5 minutes';

  if stale_credit_total > 0 then
    update public.sprite_credit_reservations
    set
      status = 'refunded',
      refunded_at = now()
    where user_id = target_user.id
      and status = 'reserved'
      and created_at < now() - interval '5 minutes';

    update public.app_users as app_user
    set
      credit_balance = app_user.credit_balance + stale_credit_total,
      updated_at = now()
    where app_user.id = target_user.id;
  end if;

  select count(*)
  into active_generation_count
  from public.sprite_credit_reservations
  where user_id = target_user.id
    and status = 'reserved';

  if active_generation_count > 0 then
    raise exception 'GENERATION_IN_PROGRESS';
  end if;

  select count(*)
  into generation_count
  from public.sprite_credit_reservations
  where user_id = target_user.id
    and created_at > now() - interval '1 hour';

  if generation_count >= 10 then
    raise exception 'GENERATION_RATE_LIMIT';
  end if;

  select *
  into target_user
  from public.app_users
  where id = target_user.id;

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

revoke all on function public.reserve_sprite_generation_credits(text, uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.reserve_sprite_generation_credits(text, uuid, text, integer)
  to service_role;

notify pgrst, 'reload schema';
