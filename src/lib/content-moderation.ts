type ModerationResult = {
  flagged?: boolean;
};

type ModerationResponse = {
  results?: ModerationResult[];
};

type ReferenceImage = {
  buffer: Buffer;
  mimeType: string;
};

export class ContentModerationRejectedError extends Error {}

export class ContentModerationUnavailableError extends Error {}

export async function assertGenerationContentIsSafe({
  prompt,
  references,
}: {
  prompt: string;
  references: ReferenceImage[];
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new ContentModerationUnavailableError(
      "Content protection is not configured.",
    );
  }

  const input = [
    { text: prompt, type: "text" },
    ...references.map(({ buffer, mimeType }) => ({
      image_url: {
        url: `data:${mimeType};base64,${buffer.toString("base64")}`,
      },
      type: "image_url",
    })),
  ];

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        model: "omni-moderation-latest",
      }),
      cache: "no-store",
    });
  } catch {
    throw new ContentModerationUnavailableError(
      "Content protection could not be reached. Please try again shortly.",
    );
  }

  let payload: ModerationResponse;
  try {
    payload = (await response.json()) as ModerationResponse;
  } catch {
    throw new ContentModerationUnavailableError(
      "Content protection returned an invalid response. Please try again shortly.",
    );
  }

  if (!response.ok || !payload.results) {
    console.error("Content moderation request failed:", response.status);
    throw new ContentModerationUnavailableError(
      "Content protection is temporarily unavailable. Please try again shortly.",
    );
  }

  if (payload.results.some((result) => result.flagged)) {
    throw new ContentModerationRejectedError(
      "This prompt or reference cannot be used to generate a sprite. Please choose a safe, game-appropriate alternative.",
    );
  }
}
