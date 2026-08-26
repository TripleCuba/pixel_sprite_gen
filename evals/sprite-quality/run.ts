import { loadEnvConfig } from "@next/env";
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { SpriteGenerationQuality } from "../../src/lib/sprite-quality";
import { processSpriteImage } from "../../src/lib/sprite-processing";
import {
  buildSpriteReviewRetryPrompt,
  reviewGeneratedSprite,
  SpriteReviewUnavailableError,
} from "../../src/lib/sprite-review";
import { buildSpritePrompt, SPRITE_CANVAS_SIZE } from "../../src/lib/sprite-rules";
import { SPRITE_QUALITY_EVAL_CASES, type SpriteQualityEvalCase } from "./cases";

loadEnvConfig(process.cwd());

const RUN_NAME = process.env.SPRITE_EVAL_RUN_NAME ?? "baseline-v1";
const QUALITY = SpriteGenerationQuality.medium;
const RESULT_DIRECTORY = path.resolve(
  process.cwd(),
  "evals",
  "sprite-quality",
  "results",
  RUN_NAME,
);

type OpenAIImageResponse = {
  data?: Array<{ b64_json?: string }>;
  error?: { message?: string };
};

type CaseResult = {
  attempts: number;
  caseId: string;
  error?: string;
  issues: string[];
  prompt: string;
  quality: typeof QUALITY;
  spriteType: SpriteQualityEvalCase["spriteType"];
  status: "error" | "failed" | "passed";
  view: SpriteQualityEvalCase["view"];
};

const writeJson = async (filePath: string, value: unknown) =>
  writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");

const ensureNewResultDirectory = async () => {
  try {
    await access(RESULT_DIRECTORY);
    throw new Error(
      `The result directory already exists: ${RESULT_DIRECTORY}. Set SPRITE_EVAL_RUN_NAME to a new name rather than overwriting a baseline.`,
    );
  } catch (error) {
    if (error instanceof Error && !error.message.includes("already exists")) {
      await mkdir(RESULT_DIRECTORY, { recursive: true });
      return;
    }

    throw error;
  }
};

const requestImage = async (prompt: string) => {
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-2",
      prompt,
      size: `${SPRITE_CANVAS_SIZE}x${SPRITE_CANVAS_SIZE}`,
      quality: QUALITY,
      output_format: "png",
      background: "opaque",
      n: 1,
    }),
  });
  const payload = (await response.json()) as OpenAIImageResponse;

  if (!response.ok || !payload.data?.[0]?.b64_json) {
    throw new Error(
      payload.error?.message ?? "The image generation service could not create a sprite.",
    );
  }

  return Buffer.from(payload.data[0].b64_json, "base64");
};

const evaluateCase = async (evalCase: SpriteQualityEvalCase): Promise<CaseResult> => {
  const caseDirectory = path.join(RESULT_DIRECTORY, evalCase.id);
  await mkdir(caseDirectory, { recursive: true });

  const basePrompt = buildSpritePrompt({
    spriteType: evalCase.spriteType,
    view: evalCase.view,
    userPrompt: evalCase.prompt,
    hasReferenceImages: false,
  });
  let retryIssues: string[] = [];

  try {
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const generatedImage = await requestImage(
        attempt === 1
          ? basePrompt
          : `${basePrompt}${buildSpriteReviewRetryPrompt(retryIssues)}`,
      );
      const sprite = await processSpriteImage(
        generatedImage,
        QUALITY,
        evalCase.spriteType,
      );
      await writeFile(path.join(caseDirectory, `attempt-${attempt}.png`), sprite);

      const review = await reviewGeneratedSprite({
        quality: QUALITY,
        source: generatedImage,
        sprite,
        spriteType: evalCase.spriteType,
        view: evalCase.view,
      });
      retryIssues = review.issues;

      if (review.passed) {
        const result: CaseResult = {
          attempts: attempt,
          caseId: evalCase.id,
          issues: [],
          prompt: evalCase.prompt,
          quality: QUALITY,
          spriteType: evalCase.spriteType,
          status: "passed",
          view: evalCase.view,
        };
        await writeJson(path.join(caseDirectory, "result.json"), result);
        return result;
      }
    }

    const result: CaseResult = {
      attempts: 2,
      caseId: evalCase.id,
      issues: retryIssues,
      prompt: evalCase.prompt,
      quality: QUALITY,
      spriteType: evalCase.spriteType,
      status: "failed",
      view: evalCase.view,
    };
    await writeJson(path.join(caseDirectory, "result.json"), result);
    return result;
  } catch (error) {
    const result: CaseResult = {
      attempts: retryIssues.length > 0 ? 2 : 0,
      caseId: evalCase.id,
      error:
        error instanceof SpriteReviewUnavailableError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown evaluation error.",
      issues: retryIssues,
      prompt: evalCase.prompt,
      quality: QUALITY,
      spriteType: evalCase.spriteType,
      status: "error",
      view: evalCase.view,
    };
    await writeJson(path.join(caseDirectory, "result.json"), result);
    return result;
  }
};

const main = async () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to run sprite evaluations.");
  }

  await ensureNewResultDirectory();
  console.log(
    `Running ${SPRITE_QUALITY_EVAL_CASES.length} sprite quality cases at ${QUALITY} quality. Results: ${RESULT_DIRECTORY}`,
  );

  const results: CaseResult[] = [];
  for (const [index, evalCase] of SPRITE_QUALITY_EVAL_CASES.entries()) {
    console.log(`[${index + 1}/${SPRITE_QUALITY_EVAL_CASES.length}] ${evalCase.id}`);
    results.push(await evaluateCase(evalCase));
  }

  const summary = {
    completedAt: new Date().toISOString(),
    failed: results.filter((result) => result.status === "failed").length,
    passed: results.filter((result) => result.status === "passed").length,
    quality: QUALITY,
    results,
    runName: RUN_NAME,
    total: results.length,
    errors: results.filter((result) => result.status === "error").length,
  };
  await writeJson(path.join(RESULT_DIRECTORY, "summary.json"), summary);
  console.log(`Finished: ${summary.passed} passed, ${summary.failed} failed, ${summary.errors} errors.`);
};

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Could not run sprite evaluations.");
  process.exitCode = 1;
});
