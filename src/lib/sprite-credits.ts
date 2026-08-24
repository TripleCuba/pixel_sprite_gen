import { randomUUID } from "crypto";
import { getSupabaseAdmin, SpriteStorageError } from "./sprite-storage";
import {
  SPRITE_QUALITY_DETAILS,
  type SpriteGenerationQuality,
} from "./sprite-quality";

const STARTER_CREDITS = 20;

export class SpriteCreditsError extends SpriteStorageError {}

export class SpriteCreditsInsufficientError extends SpriteCreditsError {}

export class SpriteGenerationRateLimitError extends SpriteCreditsError {}

export class SpriteIpRateLimitError extends SpriteCreditsError {}

export type CreditBalance = {
  balance: number;
};

export type CreditActivity = {
  creditCost: number;
  id: string;
  occurredAt: string;
  quality: SpriteGenerationQuality;
  status: "completed" | "refunded" | "reserved";
};

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function getCreditBalance(email: string): Promise<CreditBalance> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("app_users")
    .select("credit_balance")
    .eq("email", normaliseEmail(email))
    .maybeSingle();

  if (error) {
    console.error("Supabase credit lookup failed:", error);
    throw new SpriteCreditsError("Could not load your credit balance.");
  }

  return { balance: data?.credit_balance ?? STARTER_CREDITS };
}

export async function reserveGenerationCredits(
  email: string,
  quality: SpriteGenerationQuality,
) {
  const supabase = getSupabaseAdmin();
  const reservationId = randomUUID();
  const creditCost = SPRITE_QUALITY_DETAILS[quality].creditCost;
  const { data, error } = await supabase.rpc("reserve_sprite_generation_credits", {
    p_credit_cost: creditCost,
    p_email: normaliseEmail(email),
    p_quality: quality,
    p_reservation_id: reservationId,
  });

  if (error) {
    console.error("Supabase credit reservation failed:", error);

    if (error.message.includes("GENERATION_IN_PROGRESS")) {
      throw new SpriteGenerationRateLimitError(
        "A sprite is already generating. Please wait for it to finish.",
      );
    }

    if (error.message.includes("GENERATION_RATE_LIMIT")) {
      throw new SpriteGenerationRateLimitError(
        "You can generate up to 10 sprites per hour. Please try again later.",
      );
    }

    throw new SpriteCreditsError("Could not reserve credits for this sprite.");
  }

  if (!data?.[0]) {
    throw new SpriteCreditsInsufficientError(
      `You need ${creditCost} credits to generate at ${SPRITE_QUALITY_DETAILS[quality].label} quality.`,
    );
  }

  return { reservationId };
}

export async function completeGenerationCredits(reservationId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("complete_sprite_generation_credits", {
    p_reservation_id: reservationId,
  });

  if (error) {
    console.error("Supabase credit completion failed:", error);
  }
}

export async function refundGenerationCredits(reservationId: string) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("refund_sprite_generation_credits", {
    p_reservation_id: reservationId,
  });

  if (error) {
    console.error("Supabase credit refund failed:", error);
  }
}

export async function enforceIpGenerationRateLimit(fingerprint: string | null) {
  if (!fingerprint) {
    return;
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("enforce_sprite_ip_rate_limit", {
    p_event_id: randomUUID(),
    p_source_fingerprint: fingerprint,
  });

  if (error) {
    console.error("Supabase IP rate-limit check failed:", error);

    if (error.message.includes("IP_GENERATION_RATE_LIMIT")) {
      throw new SpriteIpRateLimitError(
        "Too many generation requests are coming from this network. Please try again later.",
      );
    }

    throw new SpriteCreditsError("Could not verify the generation request limit.");
  }
}

export async function listCreditActivity(email: string): Promise<CreditActivity[]> {
  const supabase = getSupabaseAdmin();
  const normalisedEmail = normaliseEmail(email);
  const { data: user, error: userError } = await supabase
    .from("app_users")
    .select("id")
    .eq("email", normalisedEmail)
    .maybeSingle();

  if (userError) {
    console.error("Supabase credit activity user lookup failed:", userError);
    throw new SpriteCreditsError("Could not load your credit activity.");
  }

  if (!user) {
    return [];
  }

  const { data, error } = await supabase
    .from("sprite_credit_reservations")
    .select("id, quality, credit_cost, status, created_at, completed_at, refunded_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Supabase credit activity lookup failed:", error);
    throw new SpriteCreditsError("Could not load your credit activity.");
  }

  return (data ?? []).map((entry) => ({
    creditCost: entry.credit_cost,
    id: entry.id,
    occurredAt: entry.completed_at ?? entry.refunded_at ?? entry.created_at,
    quality: entry.quality as SpriteGenerationQuality,
    status:
      entry.status === "completed" || entry.status === "refunded"
        ? entry.status
        : "reserved",
  }));
}
