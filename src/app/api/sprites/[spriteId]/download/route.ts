import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import { isAuthConfigured } from '@/lib/auth-config';
import { downloadStoredSprite, isSpriteStorageConfigured, SpriteStorageError } from '@/lib/sprite-storage';

const errorResponse = (message: string, status: number) => Response.json({ error: message }, { status });

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const getDownloadFilename = (title: string) => {
  const name = title
    .normalize('NFKD')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);

  return `${name || 'sprite'}.png`;
};

export async function GET(_request: Request, { params }: RouteContext<'/api/sprites/[spriteId]/download'>) {
  const { spriteId } = await params;

  if (!isAuthConfigured()) {
    return errorResponse('Authentication is not configured.', 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse('Sign in with Google to download saved sprites.', 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse('This account is not approved to download saved sprites.', 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse('Generated image storage is not configured.', 503);
  }

  if (!isUuid(spriteId)) {
    return errorResponse('A valid sprite id is required.', 400);
  }

  try {
    const sprite = await downloadStoredSprite(session.user.email, spriteId);

    if (!sprite) {
      return errorResponse('The saved sprite was not found.', 404);
    }

    const filename = getDownloadFilename(sprite.title ?? sprite.spriteType);
    const asciiFilename = filename.replace(/[^\x20-\x7E]/g, '') || 'sprite.png';

    return new Response(sprite.image, {
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Disposition': `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Content-Type': 'image/png',
      },
    });
  } catch (error) {
    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse('Could not download the saved sprite.', 500);
  }
}
