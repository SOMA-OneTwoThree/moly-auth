import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { claimSubscriptionOffer } from "@/lib/account/service";

export const runtime = "nodejs";

export const POST = withAuth(handle(async (req, user) => {
  const body = await parseJsonObject(req);
  rejectUnknownFields(body, ["platform", "plan"]);
  if ((body.platform !== "ios" && body.platform !== "android")
    || (body.plan !== "monthly" && body.plan !== "yearly")) {
    throw new ApiException("VALIDATION", 422, "지원하지 않는 구독 선택이에요.");
  }
  const offer = await claimSubscriptionOffer(createSupabaseAdminClient(), user, { platform: body.platform, plan: body.plan });
  return NextResponse.json(offer, { headers: { "Cache-Control": "private, no-store" } });
}));
