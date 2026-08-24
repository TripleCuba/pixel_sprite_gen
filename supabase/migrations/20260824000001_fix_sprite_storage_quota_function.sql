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

  update public.app_users as app_user
  set
    storage_bytes = app_user.storage_bytes + p_byte_size,
    updated_at = now()
  where app_user.id = target_user.id;

  return query
  select
    target_user.id,
    target_user.storage_limit_bytes,
    target_user.storage_bytes + p_byte_size;
end;
$$;

notify pgrst, 'reload schema';
