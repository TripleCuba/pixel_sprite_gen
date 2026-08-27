import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { isAuthConfigured } from "@/lib/auth-config";
import {
  deleteStoredSprite,
  isSpriteStorageConfigured,
  listStoredSprites,
  SpriteStorageError,
  updateStoredSpriteTitle,
} from "@/lib/sprite-storage";

const errorResponse = (message: string, status: number) =>
  Response.json({ error: message }, { status });

export async function GET() {
  if (!isAuthConfigured()) {
    return errorResponse("Authentication is not configured.", 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse("Sign in with Google to view your saved sprites.", 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse("This account is not approved to view saved sprites.", 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse("Generated image storage is not configured.", 503);
  }

  try {
    const sprites = await listStoredSprites(session.user.email);

    return Response.json(
      { sprites },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("Could not load saved sprites.", 500);
  }
}

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export async function PATCH(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse("Authentication is not configured.", 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse("Sign in with Google to rename saved sprites.", 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse("This account is not approved to rename saved sprites.", 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse("Generated image storage is not configured.", 503);
  }

  let spriteId: unknown;
  let title: unknown;

  try {
    ({ spriteId, title } = (await request.json()) as {
      spriteId?: unknown;
      title?: unknown;
    });
  } catch {
    return errorResponse("A sprite id and title are required.", 400);
  }

  if (typeof spriteId !== "string" || !isUuid(spriteId) || typeof title !== "string") {
    return errorResponse("A valid sprite id and title are required.", 400);
  }

  const normalisedTitle = title.trim();

  if (normalisedTitle.length > 120) {
    return errorResponse("Asset titles can be at most 120 characters.", 400);
  }

  try {
    const sprite = await updateStoredSpriteTitle(
      session.user.email,
      spriteId,
      normalisedTitle || null,
    );

    if (!sprite) {
      return errorResponse("The saved sprite was not found.", 404);
    }

    return Response.json({ sprite }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("Could not rename the saved sprite.", 500);
  }
}

export async function DELETE(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse("Authentication is not configured.", 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse("Sign in with Google to delete saved sprites.", 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse("This account is not approved to delete saved sprites.", 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse("Generated image storage is not configured.", 503);
  }

  let spriteId: unknown;

  try {
    ({ spriteId } = (await request.json()) as { spriteId?: unknown });
  } catch {
    return errorResponse("A sprite id is required.", 400);
  }

  if (typeof spriteId !== "string" || !isUuid(spriteId)) {
    return errorResponse("A valid sprite id is required.", 400);
  }

  try {
    const wasDeleted = await deleteStoredSprite(session.user.email, spriteId);

    if (!wasDeleted) {
      return errorResponse("The saved sprite was not found.", 404);
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("Could not delete the saved sprite.", 500);
  }
}
