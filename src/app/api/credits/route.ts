import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import { isAuthConfigured } from '@/lib/auth-config';
import { getCreditBalance, SpriteCreditsError } from '@/lib/sprite-credits';
import { isSpriteStorageConfigured } from '@/lib/sprite-storage';

const errorResponse = (message: string, status: number) => Response.json({ error: message }, { status });

export async function GET() {
  if (!isAuthConfigured()) {
    return errorResponse('Authentication is not configured.', 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse('Sign in with Google to view credits.', 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse('This account is not approved to view credits.', 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse('Generated image storage is not configured.', 503);
  }

  try {
    const credits = await getCreditBalance(session.user.email);

    return Response.json(credits, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof SpriteCreditsError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse('Could not load your credit balance.', 500);
  }
}
