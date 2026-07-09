import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { onboard } from "@/lib/account/service";
import {
  isValidLanguage,
  isValidNickname,
  isValidTimezone,
} from "@/lib/account/validation";

export const runtime = "nodejs";

/**
 * POST /onboarding — 닉네임·타임존·언어 저장(1회만) → profile + entitlement 반환.
 * 이미 온보딩 완료(nickname 존재)면 409 ALREADY_ONBOARDED.
 */
export const POST = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["nickname", "timezone", "language"]);

    if (!isValidNickname(body.nickname)) {
      throw new ApiException("VALIDATION", 422, "닉네임은 1~10자여야 해요.", {
        field: "nickname",
      });
    }
    if (!isValidTimezone(body.timezone)) {
      throw new ApiException("VALIDATION", 422, "유효하지 않은 타임존이에요.", {
        field: "timezone",
      });
    }
    if (!isValidLanguage(body.language)) {
      throw new ApiException("VALIDATION", 422, "유효하지 않은 언어 코드예요.", {
        field: "language",
      });
    }

    const admin = createSupabaseAdminClient();
    const result = await onboard(admin, user, {
      nickname: body.nickname,
      timezone: body.timezone,
      language: body.language,
    });
    return NextResponse.json(result);
  }),
);
