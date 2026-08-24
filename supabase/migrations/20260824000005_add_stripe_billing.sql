alter table public.app_users
  drop constraint if exists app_users_plan_check;

alter table public.app_users
  add constraint app_users_plan_check
  check (plan in ('free', 'pro', 'studio', 'hobby', 'creator'));

create table if not exists public.stripe_customers (
  user_id uuid primary key references public.app_users(id) on delete cascade,
  stripe_customer_id text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stripe_processed_events (
  stripe_event_id text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  kind text not null check (kind in ('payment', 'subscription')),
  credit_amount integer not null check (credit_amount > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_subscriptions (
  stripe_subscription_id text primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  stripe_customer_id text,
  plan text not null check (plan in ('hobby', 'creator', 'studio')),
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_processed_events_user_created_at_idx
  on public.stripe_processed_events (user_id, created_at desc);

create index if not exists stripe_subscriptions_user_id_idx
  on public.stripe_subscriptions (user_id);

alter table public.stripe_customers enable row level security;
alter table public.stripe_processed_events enable row level security;
alter table public.stripe_subscriptions enable row level security;

revoke all on table public.stripe_customers from anon, authenticated;
revoke all on table public.stripe_processed_events from anon, authenticated;
revoke all on table public.stripe_subscriptions from anon, authenticated;
grant all on table public.stripe_customers to service_role;
grant all on table public.stripe_processed_events to service_role;
grant all on table public.stripe_subscriptions to service_role;

create or replace function public.grant_stripe_credits(
  p_event_id text,
  p_user_email text,
  p_customer_id text,
  p_subscription_id text,
  p_kind text,
  p_credit_amount integer,
  p_plan text,
  p_storage_limit_bytes bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.app_users%rowtype;
begin
  if nullif(trim(p_event_id), '') is null
    or nullif(trim(p_user_email), '') is null
    or p_kind not in ('payment', 'subscription')
    or p_credit_amount <= 0
    or (p_plan is not null and p_plan not in ('hobby', 'creator', 'studio')) then
    raise exception 'A valid Stripe credit grant is required.';
  end if;

  insert into public.app_users (email)
  values (lower(trim(p_user_email)))
  on conflict (email) do nothing;

  select *
  into target_user
  from public.app_users
  where email = lower(trim(p_user_email))
  for update;

  insert into public.stripe_processed_events (
    stripe_event_id,
    user_id,
    kind,
    credit_amount
  )
  values (
    p_event_id,
    target_user.id,
    p_kind,
    p_credit_amount
  )
  on conflict (stripe_event_id) do nothing;

  if not found then
    return;
  end if;

  if nullif(trim(p_customer_id), '') is not null then
    insert into public.stripe_customers (user_id, stripe_customer_id)
    values (target_user.id, p_customer_id)
    on conflict (user_id) do update
    set
      stripe_customer_id = excluded.stripe_customer_id,
      updated_at = now();
  end if;

  update public.app_users as app_user
  set
    credit_balance = app_user.credit_balance + p_credit_amount,
    plan = coalesce(p_plan, app_user.plan),
    storage_limit_bytes = coalesce(p_storage_limit_bytes, app_user.storage_limit_bytes),
    updated_at = now()
  where app_user.id = target_user.id;

  if nullif(trim(p_subscription_id), '') is not null and p_plan is not null then
    insert into public.stripe_subscriptions (
      stripe_subscription_id,
      user_id,
      stripe_customer_id,
      plan,
      status
    )
    values (
      p_subscription_id,
      target_user.id,
      nullif(trim(p_customer_id), ''),
      p_plan,
      'active'
    )
    on conflict (stripe_subscription_id) do update
    set
      stripe_customer_id = excluded.stripe_customer_id,
      plan = excluded.plan,
      status = excluded.status,
      updated_at = now();
  end if;
end;
$$;

create or replace function public.sync_stripe_subscription(
  p_user_email text,
  p_customer_id text,
  p_subscription_id text,
  p_plan text,
  p_status text,
  p_storage_limit_bytes bigint,
  p_has_access boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.app_users%rowtype;
begin
  if nullif(trim(p_user_email), '') is null
    or nullif(trim(p_subscription_id), '') is null
    or nullif(trim(p_status), '') is null
    or p_plan not in ('hobby', 'creator', 'studio')
    or p_has_access is null then
    raise exception 'A valid Stripe subscription update is required.';
  end if;

  insert into public.app_users (email)
  values (lower(trim(p_user_email)))
  on conflict (email) do nothing;

  select *
  into target_user
  from public.app_users
  where email = lower(trim(p_user_email))
  for update;

  if nullif(trim(p_customer_id), '') is not null then
    insert into public.stripe_customers (user_id, stripe_customer_id)
    values (target_user.id, p_customer_id)
    on conflict (user_id) do update
    set
      stripe_customer_id = excluded.stripe_customer_id,
      updated_at = now();
  end if;

  update public.app_users as app_user
  set
    plan = case when p_has_access then p_plan else 'free' end,
    storage_limit_bytes = case
      when p_has_access then p_storage_limit_bytes
      else 104857600
    end,
    updated_at = now()
  where app_user.id = target_user.id;

  insert into public.stripe_subscriptions (
    stripe_subscription_id,
    user_id,
    stripe_customer_id,
    plan,
    status
  )
  values (
    p_subscription_id,
    target_user.id,
    nullif(trim(p_customer_id), ''),
    p_plan,
    p_status
  )
  on conflict (stripe_subscription_id) do update
  set
    stripe_customer_id = excluded.stripe_customer_id,
    plan = excluded.plan,
    status = excluded.status,
    updated_at = now();
end;
$$;

revoke all on function public.grant_stripe_credits(text, text, text, text, text, integer, text, bigint)
  from public, anon, authenticated;
revoke all on function public.sync_stripe_subscription(text, text, text, text, text, bigint, boolean)
  from public, anon, authenticated;
grant execute on function public.grant_stripe_credits(text, text, text, text, text, integer, text, bigint)
  to service_role;
grant execute on function public.sync_stripe_subscription(text, text, text, text, text, bigint, boolean)
  to service_role;

notify pgrst, 'reload schema';
