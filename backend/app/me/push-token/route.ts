import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registerPushToken } from "@/lib/account/service";

export const runtime = "nodejs";

/** POST /me/push-token — FCM 토큰 등록(토큰 UNIQUE upsert, 기기 이전 시 재귀속) → 204. */
const ALLOWED_PLATFORMS = ["ios", "android"];

export const POST = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["token", "platform"]);

    const token = body.token;
    if (typeof token !== "string" || token.length === 0) {
      throw new ApiException("VALIDATION", 422, "푸시 토큰이 필요해요.", {
        field: "token",
      });
    }
    // platform은 ios | android(DB CHECK와 동기) — 생략 시 ios(기존 iOS 클라 하위호환).
    const platform = body.platform === undefined ? "ios" : body.platform;
    if (typeof platform !== "string" || !ALLOWED_PLATFORMS.includes(platform)) {
      throw new ApiException("VALIDATION", 422, "지원하지 않는 플랫폼이에요.", {
        field: "platform",
      });
    }

    const admin = createSupabaseAdminClient();
    await registerPushToken(admin, user.id, token, platform);
    return new NextResponse(null, { status: 204 });
  }),
);
