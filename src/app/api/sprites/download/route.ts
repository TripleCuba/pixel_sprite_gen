import { ZipArchive } from "archiver";
import { Readable, PassThrough } from "stream";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { isAuthConfigured } from "@/lib/auth-config";
import {
  downloadStoredSprite,
  isSpriteStorageConfigured,
  SpriteStorageError,
} from "@/lib/sprite-storage";

export const runtime = "nodejs";

const errorResponse = (message: string, status: number) =>
  Response.json({ error: message }, { status });

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse("Authentication is not configured.", 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse("Sign in with Google to download saved sprites.", 401);
  }

  const email = session.user.email;

  if (!isEmailAllowed(email)) {
    return errorResponse("This account is not approved to download saved sprites.", 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse("Generated image storage is not configured.", 503);
  }

  let spriteIds: unknown;

  try {
    ({ spriteIds } = (await request.json()) as { spriteIds?: unknown });
  } catch {
    return errorResponse("Sprite ids are required.", 400);
  }

  if (
    !Array.isArray(spriteIds) ||
    spriteIds.length === 0 ||
    spriteIds.length > 50 ||
    new Set(spriteIds).size !== spriteIds.length ||
    spriteIds.some((id) => typeof id !== "string" || !isUuid(id))
  ) {
    return errorResponse("Provide between 1 and 50 unique valid sprite ids.", 400);
  }

  try {
    const sprites = await Promise.all(
      spriteIds.map((spriteId) => downloadStoredSprite(email, spriteId)),
    );

    if (sprites.some((sprite) => sprite === null)) {
      return errorResponse("One or more saved sprites could not be found.", 404);
    }

    const output = new PassThrough();
    const archive = new ZipArchive({ zlib: { level: 9 } });
    archive.on("error", (error) => output.destroy(error));
    archive.pipe(output);

    sprites.forEach((sprite, index) => {
      archive.append(sprite!, { name: `sprite-${index + 1}.png` });
    });
    void archive.finalize();

    return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'attachment; filename="sprites.zip"',
        "Content-Type": "application/zip",
      },
    });
  } catch (error) {
    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("Could not prepare the selected sprites for download.", 500);
  }
}
