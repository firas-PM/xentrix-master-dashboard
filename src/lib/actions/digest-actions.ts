"use server";

import { requireFounder } from "@/lib/access";
import { sendFounderDigest } from "@/lib/digest";

export type SendDigestResult = { ok: true; sent: number } | { ok: false; error: string };

export async function sendDigestNow(): Promise<SendDigestResult> {
  await requireFounder();
  try {
    const res = await sendFounderDigest();
    if (res.skipped) return { ok: false, error: res.skipped };
    return { ok: true, sent: res.sent };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "digest failed",
    };
  }
}
