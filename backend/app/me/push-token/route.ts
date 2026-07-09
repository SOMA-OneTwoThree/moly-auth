import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registerPushToken } from "@/lib/account/service";

export const runtime = "nodejs";

/** POST /me/push-token — APNs 토큰 등록(토큰 UNIQUE upsert, 기기 이전 시 재귀속) → 204. */
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
    // platform은 현재 ios만(DB CHECK와 동기) — 생략 시 ios.
    const platform = body.platform === undefined ? "ios" : body.platform;
    if (platform !== "ios") {
      throw new ApiException("VALIDATION", 422, "지원하지 않는 플랫폼이에요.", {
        field: "platform",
      });
    }

    const admin = createSupabaseAdminClient();
    await registerPushToken(admin, user.id, token, platform);
    return new NextResponse(null, { status: 204 });
  }),
);
