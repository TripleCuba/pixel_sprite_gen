import { SpriteType } from "@/app/constants";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { processSpriteImage } from "@/lib/sprite-processing";
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
  const references = formData
    .getAll("references")
    .filter((entry): entry is File => entry instanceof File);

  if (typeof spriteTypeValue !== "string" || !isSpriteType(spriteTypeValue)) {
    return errorResponse("Select a valid sprite type.", 400);
  }

  if (typeof promptValue !== "string" || !promptValue.trim()) {
    return errorResponse("Describe the sprite you want to generate.", 400);
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

  const modelParameters = {
    model: "gpt-image-2",
    prompt: buildSpritePrompt({
    spriteType: spriteTypeValue,
    userPrompt: promptValue,
    hasReferenceImages: references.length > 0,
    }),
    size: `${SPRITE_CANVAS_SIZE}x${SPRITE_CANVAS_SIZE}`,
    quality: "medium",
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
    return errorResponse("Could not reach the image generation service.", 502);
  }

  let modelPayload: OpenAIImageResponse;
  try {
    modelPayload = (await modelResponse.json()) as OpenAIImageResponse;
  } catch {
    return errorResponse("The image generation service returned an invalid response.", 502);
  }

  if (!modelResponse.ok || !modelPayload.data?.[0]?.b64_json) {
    return errorResponse(
      modelPayload.error?.message ?? "The image generation service could not create a sprite.",
      modelResponse.ok ? 502 : modelResponse.status,
    );
  }

  try {
    const generatedImage = Buffer.from(modelPayload.data[0].b64_json, "base64");
    const sprite = await processSpriteImage(generatedImage);

    return new Response(sprite, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="sprite.png"',
        "Content-Type": "image/png",
      },
    });
  } catch {
    return errorResponse("The generated image could not be processed into a sprite.", 500);
  }
}
