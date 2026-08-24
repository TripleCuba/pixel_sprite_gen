import { randomUUID } from "crypto";
import { getSupabaseAdmin, SpriteStorageError } from "./sprite-storage";
import {
  SPRITE_QUALITY_DETAILS,
  type SpriteGenerationQuality,
} from "./sprite-quality";

const STARTER_CREDITS = 20;

export class SpriteCreditsError extends SpriteStorageError {}

export class SpriteCreditsInsufficientError extends SpriteCreditsError {}

export type CreditBalance = {
  balance: number;
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
