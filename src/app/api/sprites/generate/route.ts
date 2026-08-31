import { isSpriteViewAvailableForType, SpriteType, SpriteView } from '@/app/constants';
import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import {
  refundGenerationCredits,
  reserveGenerationCredits,
  completeGenerationCredits,
  enforceIpGenerationRateLimit,
  SpriteIpRateLimitError,
  SpriteGenerationRateLimitError,
  SpriteCreditsError,
  SpriteCreditsInsufficientError,
} from '@/lib/sprite-credits';
import { getClientFingerprint } from '@/lib/sprite-rate-limit';
import {
  assertGenerationContentIsSafe,
  ContentModerationRejectedError,
  ContentModerationUnavailableError,
} from '@/lib/content-moderation';
import { processSpriteImage } from '@/lib/sprite-processing';
import { buildSpriteReviewRetryPrompt, reviewGeneratedSprite, SpriteReviewUnavailableError } from '@/lib/sprite-review';
import { isSpriteGenerationQuality } from '@/lib/sprite-quality';
import {
  isSpriteStorageConfigured,
  SpriteStorageConfigurationError,
  SpriteStorageError,
  SpriteStorageQuotaError,
  storeGeneratedSprite,
} from '@/lib/sprite-storage';
import { isAuthConfigured } from '@/lib/auth-config';
import { buildSpritePrompt, SPRITE_CANVAS_SIZE } from '@/lib/sprite-rules';

export const runtime = 'nodejs';
export const maxDuration = 120;

const MAX_REFERENCES = 4;
const MAX_REFERENCE_BYTES = 8 * 1024 * 1024;
const MAX_TOTAL_REFERENCE_BYTES = 12 * 1024 * 1024;
const MAX_PROMPT_LENGTH = 1_000;
const MAX_TITLE_LENGTH = 120;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

class ImageGenerationServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ImageGenerationServiceError';
    this.status = status;
  }
}

const errorResponse = (message: string, status: number) => Response.json({ error: message }, { status });

const reviewIssueLabels: Record<string, string> = {
  unreadable_subject: 'the subject was not readable',
  multiple_subjects: 'more than one main subject was detected',
  wrong_camera_angle: 'the camera view did not match your selection',
  contains_text_or_ui: 'text or UI was detected',
  contains_watermark_or_frame: 'a watermark or frame was detected',
  contains_scene_background: 'a scene background was detected',
  not_pixel_art: 'the result did not read as pixel art',
};

const formatReviewFeedback = (issues: string[]) =>
  issues
    .slice(0, 2)
    .map((issue) => reviewIssueLabels[issue] ?? issue)
    .join('; ');

const isSpriteType = (value: string): value is SpriteType => Object.values(SpriteType).includes(value as SpriteType);

const isSpriteView = (value: string): value is SpriteView => Object.values(SpriteView).includes(value as SpriteView);

const matchesImageSignature = (buffer: Buffer, type: string) => {
  if (type === 'image/png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (type === 'image/jpeg') {
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  }

  return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
};

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse('Authentication is not configured. Add the Google OAuth values to .env.local.', 503);
  }

  const session = await auth();

  if (!session?.user) {
    return errorResponse('Sign in with Google before generating a sprite.', 401);
  }

  const userEmail = session.user.email;

  if (!userEmail) {
    return errorResponse('Your account email is unavailable. Please sign in again.', 401);
  }

  if (!isEmailAllowed(userEmail)) {
    return errorResponse('This account is not approved to generate sprites.', 403);
  }

  if (!isSpriteStorageConfigured()) {
    return errorResponse('Generated image storage is not configured. Add the Supabase environment values.', 503);
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResponse('Image generation is not configured. Add OPENAI_API_KEY to .env.local.', 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse('Send the generation request as form data.', 400);
  }

  const spriteTypeValue = formData.get('spriteType');
  const viewValue = formData.get('view');
  const promptValue = formData.get('prompt');
  const qualityValue = formData.get('quality');
  const titleValue = formData.get('title');
  const references = formData.getAll('references').filter((entry): entry is File => entry instanceof File);

  if (typeof spriteTypeValue !== 'string' || !isSpriteType(spriteTypeValue)) {
    return errorResponse('Select a valid sprite type.', 400);
  }

  if (typeof viewValue !== 'string' || !isSpriteView(viewValue)) {
    return errorResponse('Select a valid sprite view.', 400);
  }

  if (!isSpriteViewAvailableForType(spriteTypeValue, viewValue)) {
    return errorResponse(`${viewValue} is not available for ${spriteTypeValue} sprites.`, 400);
  }

  if (typeof promptValue !== 'string' || !promptValue.trim()) {
    return errorResponse('Describe the sprite you want to generate.', 400);
  }

  if (titleValue !== null && typeof titleValue !== 'string') {
    return errorResponse('Enter the asset title as text.', 400);
  }

  const title = titleValue?.trim() ?? '';

  if (title.length > MAX_TITLE_LENGTH) {
    return errorResponse(`Keep the asset title under ${MAX_TITLE_LENGTH} characters.`, 400);
  }

  if (typeof qualityValue !== 'string' || !isSpriteGenerationQuality(qualityValue)) {
    return errorResponse('Select a valid generation quality.', 400);
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
    return errorResponse('References must be PNG, JPEG, or WebP images no larger than 8 MB each.', 400);
  }

  const totalReferenceBytes = references.reduce((total, file) => total + file.size, 0);

  if (totalReferenceBytes > MAX_TOTAL_REFERENCE_BYTES) {
    return errorResponse('Keep all reference images under 12 MB in total.', 400);
  }

  const referenceImages = await Promise.all(
    references.map(async (file) => ({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
    })),
  );

  if (referenceImages.some(({ buffer, mimeType }) => !matchesImageSignature(buffer, mimeType))) {
    return errorResponse('One or more reference files are not valid PNG, JPEG, or WebP images.', 400);
  }

  try {
    await assertGenerationContentIsSafe({
      prompt: promptValue.trim(),
      references: referenceImages,
    });
  } catch (error) {
    if (error instanceof ContentModerationRejectedError) {
      return errorResponse(error.message, 400);
    }

    if (error instanceof ContentModerationUnavailableError) {
      return errorResponse(error.message, 503);
    }

    return errorResponse('Content protection could not validate this request.', 503);
  }

  try {
    await enforceIpGenerationRateLimit(getClientFingerprint(request));
  } catch (error) {
    if (error instanceof SpriteIpRateLimitError) {
      return errorResponse(error.message, 429);
    }

    if (error instanceof SpriteCreditsError) {
      return errorResponse(error.message, 503);
    }

    return errorResponse('Could not verify the generation request limit.', 503);
  }

  let creditReservation: { reservationId: string | null };
  try {
    creditReservation = await reserveGenerationCredits(userEmail, qualityValue);
  } catch (error) {
    if (error instanceof SpriteGenerationRateLimitError) {
      return errorResponse(error.message, 429);
    }

    if (error instanceof SpriteCreditsInsufficientError) {
      return errorResponse(error.message, 402);
    }

    if (error instanceof SpriteCreditsError) {
      return errorResponse(error.message, 502);
    }

    return errorResponse('Could not reserve credits for this sprite.', 500);
  }

  const refundCredits = async () => {
    if (creditReservation.reservationId) {
      await refundGenerationCredits(creditReservation.reservationId);
    }
  };

  const generateImage = async (prompt: string) => {
    const modelParameters = {
      model: 'gpt-image-2',
      prompt,
      size: `${SPRITE_CANVAS_SIZE}x${SPRITE_CANVAS_SIZE}`,
      // The user-selected quality is validated and charged before this request.
      quality: qualityValue,
      output_format: 'png',
      background: 'opaque',
      n: 1,
    };

    let modelResponse: Response;
    try {
      if (references.length === 0) {
        modelResponse = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(modelParameters),
          cache: 'no-store',
        });
      } else {
        const modelRequest = new FormData();
        Object.entries(modelParameters).forEach(([key, value]) => modelRequest.set(key, String(value)));

        for (const reference of references) {
          modelRequest.append('image', reference, reference.name);
        }

        modelResponse = await fetch('https://api.openai.com/v1/images/edits', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: modelRequest,
          cache: 'no-store',
        });
      }
    } catch {
      throw new ImageGenerationServiceError('Could not reach the image generation service.', 502);
    }

    let modelPayload: OpenAIImageResponse;
    try {
      modelPayload = (await modelResponse.json()) as OpenAIImageResponse;
    } catch {
      throw new ImageGenerationServiceError('The image generation service returned an invalid response.', 502);
    }

    if (!modelResponse.ok || !modelPayload.data?.[0]?.b64_json) {
      throw new ImageGenerationServiceError(
        modelPayload.error?.message ?? 'The image generation service could not create a sprite.',
        modelResponse.ok ? 502 : modelResponse.status,
      );
    }

    return Buffer.from(modelPayload.data[0].b64_json, 'base64');
  };

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const updateProgress = (label: string, description: string, progress: number) =>
        send({ type: 'progress', progress: { label, description, progress } });

      try {
        const basePrompt = buildSpritePrompt({
          spriteType: spriteTypeValue,
          view: viewValue,
          userPrompt: promptValue,
          hasReferenceImages: references.length > 0,
        });
        let retryIssues: string[] = [];

        for (let attempt = 0; attempt < 2; attempt += 1) {
          updateProgress(
            attempt === 0 ? 'Creating your sprite...' : 'Refining your sprite...',
            attempt === 0
              ? 'The image model is creating the initial sprite.'
              : 'The first result needed a final quality correction.',
            attempt === 0 ? 50 : 58,
          );
          const generatedImage = await generateImage(
            attempt === 0 ? basePrompt : `${basePrompt}${buildSpriteReviewRetryPrompt(retryIssues)}`,
          );

          updateProgress(
            'Pixel-snapping the result...',
            'Removing the background and preparing the pixel-art export.',
            attempt === 0 ? 68 : 76,
          );
          const sprite = await processSpriteImage(generatedImage, qualityValue, spriteTypeValue);

          updateProgress(
            'Reviewing sprite quality...',
            'Checking composition, readability, and export rules.',
            attempt === 0 ? 80 : 88,
          );
          const review = await reviewGeneratedSprite({
            quality: qualityValue,
            source: generatedImage,
            sprite,
            spriteType: spriteTypeValue,
            view: viewValue,
          });

          if (!review.passed) {
            console.info('Generated sprite did not pass quality review:', {
              attempt: attempt + 1,
              issues: review.issues,
            });
            retryIssues = review.issues;
            continue;
          }

          updateProgress('Saving your sprite...', 'Storing the finished asset in your library.', 94);
          const storedSprite = await storeGeneratedSprite({
            email: userEmail,
            image: sprite,
            prompt: promptValue,
            spriteType: spriteTypeValue,
            title: title || null,
          });
          if (creditReservation.reservationId) {
            await completeGenerationCredits(creditReservation.reservationId);
          }

          send({
            type: 'complete',
            image: sprite.toString('base64'),
            spriteId: storedSprite.id,
          });
          return;
        }

        await refundCredits();
        const reviewFeedback = formatReviewFeedback(retryIssues);
        send({
          type: 'error',
          message: `The generated image did not meet the sprite quality checks${reviewFeedback ? `: ${reviewFeedback}` : ''}. Your credits were restored; please try again with a more specific prompt.`,
        });
      } catch (error) {
        await refundCredits();

        if (
          error instanceof ImageGenerationServiceError ||
          error instanceof SpriteReviewUnavailableError ||
          error instanceof SpriteStorageQuotaError ||
          error instanceof SpriteStorageConfigurationError ||
          error instanceof SpriteStorageError
        ) {
          send({ type: 'error', message: error.message });
        } else {
          send({
            type: 'error',
            message: 'The generated image could not be processed into a sprite.',
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'X-Accel-Buffering': 'no',
    },
  });
}
