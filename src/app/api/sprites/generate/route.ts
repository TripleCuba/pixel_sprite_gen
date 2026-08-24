import { SpriteType } from "@/app/constants";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import {
  refundGenerationCredits,
  reserveGenerationCredits,
  completeGenerationCredits,
  SpriteCreditsError,
  SpriteCreditsInsufficientError,
} from "@/lib/sprite-credits";
import { processSpriteImage } from "@/lib/sprite-processing";
import { isSpriteGenerationQuality } from "@/lib/sprite-quality";
import {
  isSpriteStorageConfigured,
  SpriteStorageConfigurationError,
  SpriteStorageError,
  SpriteStorageQuotaError,
  storeGeneratedSprite,
} from "@/lib/sprite-storage";
import { isAuthConfigured } from "@/lib/auth-config";
import { buildSpritePrompt, SPRITE_CANVAS_SIZE } from "@/lib/sprite-rules";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_REFERENCES = 4;
const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 1_000;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

const errorResponse = (message: string, status: number) =>
  Response.json({ error: message }, { status });

const isSpriteType = (value: string): value is SpriteType =>
  Object.values(SpriteType).includes(value as SpriteType);

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse(
      "Authentication is not configured. Add the Google OAuth values to .env.local.",
      503,
    );
  }

  const session = await auth();

  if (!session?.user) {
    return errorResponse("Sign in with Google before generating a sprite.", 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse("This account is not approved to generate sprites.", 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse(
      "Generated image storage is not configured. Add the Supabase environment values.",
      503,
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse(
      "Image generation is not configured. Add OPENAI_API_KEY to .env.local.",
      503,
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Send the generation request as form data.", 400);
  }

  const spriteTypeValue = formData.get("spriteType");
  const promptValue = formData.get("prompt");
  const qualityValue = formData.get("quality");
  const references = formData
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File);

  if (typeof spriteTypeValue !== "string" || !isSpriteType(spriteTypeValue)) {
    return errorResponse("Select a valid sprite type.", 400);
  }

  if (typeof promptValue !== "string" || !promptValue.trim()) {
    return errorResponse("Describe the sprite you want to generate.", 400);
  }

  if (
    typeof qualityValue !== "string" ||
    !isSpriteGenerationQuality(qualityValue)
  ) {
    return errorResponse("Select a valid generation quality.", 400);
  }

  if (promptValue.length > MAX_PROMPT_LENGTH) {
    return errorResponse(`Keep the prompt under ${MAX_PROMPT_LENGTH} characters.`, 400);
  }

  if (references.length > MAX_REFERENCES) {
    return errorResponse(`Attach at most ${MAX_REFERENCES} reference images.`, 400);
  }

  const invalidReference = references.find(
    (file) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_REFERENCE_BYTES,
  );

  if (invalidReference) {
    return errorResponse(
      "References must be PNG, JPEG, or WebP images no larger than 8 MB each.",
      400,
    );
  }

  let creditReservation: { reservationId: string };
  try {
    creditReservation = await reserveGenerationCredits(
      session.user.email!,
      qualityValue,
    );
  } catch (error) {
    if (error instanceof SpriteCreditsInsufficientError) {
      return errorResponse(error.message, 402);
    }

    if (error instanceof SpriteCreditsError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("Could not reserve credits for this sprite.", 500);
  }

  const refundCredits = async () => {
    await refundGenerationCredits(creditReservation.reservationId);
  };

  const modelParameters = {
    model: "gpt-image-2",
    prompt: buildSpritePrompt({
    spriteType: spriteTypeValue,
    userPrompt: promptValue,
    hasReferenceImages: references.length > 0,
    }),
    size: `${SPRITE_CANVAS_SIZE}x${SPRITE_CANVAS_SIZE}`,
    // Low quality is sufficient because every result is reduced to a 64px
    // pixel grid before export. It is substantially cheaper than medium while
    // retaining the 1024px square canvas required for clean composition.
    quality: qualityValue,
    output_format: "png",
    background: "opaque",
    n: 1,
  };

  let modelResponse: Response;
  try {
    if (references.length === 0) {
      modelResponse = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(modelParameters),
        cache: "no-store",
      });
    } else {
      const modelRequest = new FormData();
      Object.entries(modelParameters).forEach(([key, value]) =>
        modelRequest.set(key, String(value)),
      );

      for (const reference of references) {
        modelRequest.append("image", reference, reference.name);
      }

      modelResponse = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: modelRequest,
        cache: "no-store",
      });
    }
  } catch {
    await refundCredits();
    return errorResponse("Could not reach the image generation service.", 502);
  }

  let modelPayload: OpenAIImageResponse;
  try {
    modelPayload = (await modelResponse.json()) as OpenAIImageResponse;
  } catch {
    await refundCredits();
    return errorResponse("The image generation service returned an invalid response.", 502);
  }

  if (!modelResponse.ok || !modelPayload.data?.[0]?.b64_json) {
    await refundCredits();
    return errorResponse(
      modelPayload.error?.message ?? "The image generation service could not create a sprite.",
      modelResponse.ok ? 502 : modelResponse.status,
    );
  }

  try {
    const generatedImage = Buffer.from(modelPayload.data[0].b64_json, "base64");
    const sprite = await processSpriteImage(generatedImage);
    const storedSprite = await storeGeneratedSprite({
      email: session.user.email!,
      image: sprite,
      prompt: promptValue,
      spriteType: spriteTypeValue,
    });
    await completeGenerationCredits(creditReservation.reservationId);

    return new Response(sprite, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="sprite.png"',
        "Content-Type": "image/png",
        "X-Sprite-Id": storedSprite.id,
      },
    });
  } catch (error) {
    await refundCredits();

    if (error instanceof SpriteStorageQuotaError) {
      return errorResponse(error.message, 413);
    }

    if (error instanceof SpriteStorageConfigurationError) {
      return errorResponse(error.message, 503);
    }

    if (error instanceof SpriteStorageError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse("The generated image could not be processed into a sprite.", 500);
  }
}
