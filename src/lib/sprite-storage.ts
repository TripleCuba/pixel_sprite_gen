import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'generated-sprites';

export class SpriteStorageConfigurationError extends Error {}

export class SpriteStorageQuotaError extends Error {}

export class SpriteStorageError extends Error {}

type StoreGeneratedSpriteInput = {
  email: string;
  image: Buffer;
  prompt: string;
  spriteType: string;
  title: string | null;
};

export type StoredSprite = {
  createdAt: string;
  id: string;
  imageUrl: string;
  spriteType: string;
  title: string | null;
};

type ListStoredSpritesOptions = {
  limit?: number;
  offset?: number;
};

export type StoredSpritePage = {
  hasMore: boolean;
  sprites: StoredSprite[];
  total: number;
};

export const getSupabaseAdmin = () => {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SpriteStorageConfigurationError('Generated image storage is not configured.');
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
};

export const isSpriteStorageConfigured = () =>
  Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function storeGeneratedSprite({ email, image, prompt, spriteType, title }: StoreGeneratedSpriteInput) {
  const supabase = getSupabaseAdmin();
  const spriteId = randomUUID();
  const storagePath = `sprites/${spriteId}.png`;

  const { data: reservation, error: reservationError } = await supabase.rpc('reserve_generated_sprite', {
    p_byte_size: image.byteLength,
    p_email: email,
    p_prompt: prompt,
    p_sprite_id: spriteId,
    p_sprite_type: spriteType,
    p_storage_path: storagePath,
    p_title: title,
  });

  if (reservationError) {
    console.error('Supabase sprite-storage reservation failed:', reservationError);
    throw new SpriteStorageError('Could not reserve space for the generated sprite.');
  }

  if (!reservation?.[0]) {
    throw new SpriteStorageQuotaError('Your image storage limit has been reached.');
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, image, {
    cacheControl: '31536000',
    contentType: 'image/png',
    upsert: false,
  });

  if (uploadError) {
    console.error('Supabase sprite upload failed:', uploadError);
    await supabase.rpc('release_generated_sprite_reservation', {
      p_sprite_id: spriteId,
    });

    throw new SpriteStorageError('Could not store the generated sprite.');
  }

  return {
    id: spriteId,
    storagePath,
  };
}

export async function listStoredSprites(
  email: string,
  { limit = 50, offset = 0 }: ListStoredSpritesOptions = {},
): Promise<StoredSpritePage> {
  const supabase = getSupabaseAdmin();
  const normalisedEmail = email.trim().toLowerCase();
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', normalisedEmail)
    .maybeSingle();

  if (userError) {
    console.error('Supabase user lookup failed:', userError);
    throw new SpriteStorageError('Could not load saved sprites.');
  }

  if (!user) {
    return { hasMore: false, sprites: [], total: 0 };
  }

  const pageLimit = Math.max(1, Math.min(limit, 100));

  const {
    data: sprites,
    error: spritesError,
    count,
  } = await supabase
    .from('generated_sprites')
    .select('id, storage_path, sprite_type, title, created_at', {
      count: 'exact',
    })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageLimit);

  if (spritesError) {
    console.error('Supabase sprite history lookup failed:', spritesError);
    throw new SpriteStorageError('Could not load saved sprites.');
  }

  const pageSprites = (sprites ?? []).slice(0, pageLimit);
  const signedSprites = await Promise.all(
    pageSprites.map(async (sprite) => {
      const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(sprite.storage_path, 60 * 60);

      if (error || !data?.signedUrl) {
        console.error('Supabase signed URL creation failed:', error);
        return null;
      }

      return {
        createdAt: sprite.created_at,
        id: sprite.id,
        imageUrl: data.signedUrl,
        spriteType: sprite.sprite_type,
        title: sprite.title,
      } satisfies StoredSprite;
    }),
  );

  return {
    hasMore: (sprites?.length ?? 0) > pageLimit,
    sprites: signedSprites.filter((sprite): sprite is StoredSprite => sprite !== null),
    total: count ?? 0,
  };
}

export async function deleteStoredSprite(email: string, spriteId: string) {
  const supabase = getSupabaseAdmin();
  const normalisedEmail = email.trim().toLowerCase();
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', normalisedEmail)
    .maybeSingle();

  if (userError) {
    console.error('Supabase user lookup failed:', userError);
    throw new SpriteStorageError('Could not delete the saved sprite.');
  }

  if (!user) {
    return false;
  }

  const { data: sprite, error: spriteError } = await supabase
    .from('generated_sprites')
    .select('storage_path')
    .eq('id', spriteId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (spriteError) {
    console.error('Supabase sprite lookup failed:', spriteError);
    throw new SpriteStorageError('Could not delete the saved sprite.');
  }

  if (!sprite) {
    return false;
  }

  const { error: removeError } = await supabase.storage.from(BUCKET_NAME).remove([sprite.storage_path]);

  if (removeError) {
    console.error('Supabase sprite deletion failed:', removeError);
    throw new SpriteStorageError('Could not delete the saved sprite.');
  }

  const { error: releaseError } = await supabase.rpc('release_generated_sprite_reservation', { p_sprite_id: spriteId });

  if (releaseError) {
    console.error('Supabase sprite quota release failed:', releaseError);
    throw new SpriteStorageError('The image was deleted, but its storage could not be released.');
  }

  return true;
}

export async function deleteStoredSprites(email: string, spriteIds: string[]) {
  const results = await Promise.allSettled(
    spriteIds.map(async (spriteId) => {
      const wasDeleted = await deleteStoredSprite(email, spriteId);

      if (!wasDeleted) {
        throw new SpriteStorageError('The saved sprite was not found.');
      }

      return spriteId;
    }),
  );

  const deletedSpriteIds: string[] = [];
  const failedSpriteIds: string[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      deletedSpriteIds.push(result.value);
      return;
    }

    console.error('Bulk sprite deletion failed:', result.reason);
    failedSpriteIds.push(spriteIds[index]);
  });

  return { deletedSpriteIds, failedSpriteIds };
}

export async function downloadStoredSprite(email: string, spriteId: string) {
  const supabase = getSupabaseAdmin();
  const normalisedEmail = email.trim().toLowerCase();
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', normalisedEmail)
    .maybeSingle();

  if (userError) {
    console.error('Supabase user lookup failed:', userError);
    throw new SpriteStorageError('Could not download the saved sprite.');
  }

  if (!user) {
    return null;
  }

  const { data: sprite, error: spriteError } = await supabase
    .from('generated_sprites')
    .select('storage_path, sprite_type, title')
    .eq('id', spriteId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (spriteError) {
    console.error('Supabase sprite lookup failed:', spriteError);
    throw new SpriteStorageError('Could not download the saved sprite.');
  }

  if (!sprite) {
    return null;
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(sprite.storage_path);

  if (error || !data) {
    console.error('Supabase sprite download failed:', error);
    throw new SpriteStorageError('Could not download the saved sprite.');
  }

  return {
    image: Buffer.from(await data.arrayBuffer()),
    spriteType: sprite.sprite_type,
    title: sprite.title,
  };
}

export async function updateStoredSpriteTitle(email: string, spriteId: string, title: string | null) {
  const supabase = getSupabaseAdmin();
  const normalisedEmail = email.trim().toLowerCase();
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', normalisedEmail)
    .maybeSingle();

  if (userError) {
    console.error('Supabase user lookup failed:', userError);
    throw new SpriteStorageError('Could not rename the saved sprite.');
  }

  if (!user) {
    return null;
  }

  const { data: sprite, error: spriteError } = await supabase
    .from('generated_sprites')
    .update({ title })
    .eq('id', spriteId)
    .eq('user_id', user.id)
    .select('id, title')
    .maybeSingle();

  if (spriteError) {
    console.error('Supabase sprite title update failed:', spriteError);
    throw new SpriteStorageError('Could not rename the saved sprite.');
  }

  return sprite;
}
