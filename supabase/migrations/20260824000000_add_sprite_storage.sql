create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  plan text not null default 'free' check (plan in ('free', 'pro', 'studio')),
  storage_limit_bytes bigint not null default 104857600 check (storage_limit_bytes >= 0),
  storage_bytes bigint not null default 0 check (storage_bytes >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.generated_sprites (
  id uuid primary key,
  user_id uuid not null references public.app_users(id) on delete cascade,
  storage_path text not null unique,
  sprite_type text not null,
  prompt text not null,
  byte_size integer not null check (byte_size > 0),
  created_at timestamptz not null default now()
);

create index if not exists generated_sprites_user_created_at_idx
  on public.generated_sprites (user_id, created_at desc);

alter table public.app_users enable row level security;
alter table public.generated_sprites enable row level security;

revoke all on table public.app_users from anon, authenticated;
revoke all on table public.generated_sprites from anon, authenticated;
grant all on table public.app_users to service_role;
grant all on table public.generated_sprites to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'generated-sprites',
  'generated-sprites',
  false,
  5242880,
  array['image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.reserve_generated_sprite(
  p_email text,
  p_sprite_id uuid,
  p_storage_path text,
  p_sprite_type text,
  p_prompt text,
  p_byte_size integer
)
returns table (user_id uuid, storage_limit_bytes bigint, storage_bytes bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user public.app_users%rowtype;
begin
  if nullif(trim(p_email), '') is null or p_byte_size <= 0 then
    raise exception 'A valid email and byte size are required.';
  end if;

  insert into public.app_users (email)
  values (lower(trim(p_email)))
  on conflict (email) do nothing;

  select *
  into target_user
  from public.app_users
  where email = lower(trim(p_email))
  for update;

  if target_user.storage_bytes + p_byte_size > target_user.storage_limit_bytes then
    return;
  end if;

  insert into public.generated_sprites (
    id,
    user_id,
    storage_path,
    sprite_type,
    prompt,
    byte_size
  )
  values (
    p_sprite_id,
    target_user.id,
    p_storage_path,
    p_sprite_type,
    p_prompt,
    p_byte_size
  );

  update public.app_users
  set
    storage_bytes = storage_bytes + p_byte_size,
    updated_at = now()
  where id = target_user.id;

  return query
  select
    target_user.id,
    target_user.storage_limit_bytes,
    target_user.storage_bytes + p_byte_size;
end;
$$;

create or replace function public.release_generated_sprite_reservation(
  p_sprite_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved_sprite public.generated_sprites%rowtype;
begin
  select *
  into reserved_sprite
  from public.generated_sprites
  where id = p_sprite_id
  for update;

  if not found then
    return;
  end if;

  delete from public.generated_sprites where id = p_sprite_id;

  update public.app_users
  set
    storage_bytes = greatest(storage_bytes - reserved_sprite.byte_size, 0),
    updated_at = now()
  where id = reserved_sprite.user_id;
end;
$$;

revoke all on function public.reserve_generated_sprite(text, uuid, text, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.release_generated_sprite_reservation(uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_generated_sprite(text, uuid, text, text, text, integer)
  to service_role;
grant execute on function public.release_generated_sprite_reservation(uuid)
  to service_role;
