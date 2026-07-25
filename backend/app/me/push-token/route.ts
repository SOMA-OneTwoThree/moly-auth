import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registerPushToken } from "@/lib/account/service";
import { isValidPlatform } from "@/lib/account/validation";

export const runtime = "nodejs";

// FCM 토큰 상한 — 실제 토큰은 ~300자 미만. 과도한 입력을 앱 레이어에서 차단(defense-in-depth).
const MAX_TOKEN_LENGTH = 500;

/** POST /me/push-token — FCM 토큰 등록(토큰 UNIQUE upsert, 기기 이전 시 재귀속) → 204. */
export const POST = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["token", "platform"]);

    const token = body.token;
    if (typeof token !== "string" || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
      throw new ApiException("VALIDATION", 422, "푸시 토큰이 필요해요.", {
        field: "token",
      });
    }
    // platform은 ios | android(DB CHECK와 동기) — 생략 시 ios(기존 iOS 클라 하위호환).
    const platform = body.platform === undefined ? "ios" : body.platform;
    if (!isValidPlatform(platform)) {
      throw new ApiException("VALIDATION", 422, "지원하지 않는 플랫폼이에요.", {
        field: "platform",
      });
    }

    const admin = createSupabaseAdminClient();
    await registerPushToken(admin, user.id, token, platform);
    return new NextResponse(null, { status: 204 });
  }),
);
