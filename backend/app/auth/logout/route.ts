import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { logoutDevice } from "@/lib/account/service";

export const runtime = "nodejs";

/**
 * POST /auth/logout — 해당 푸시 토큰만 무효화(멀티 기기 안전) → 204.
 * 세션 종료는 클라이언트의 Supabase signOut 몫.
 */
export const POST = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["push_token"]);

    const pushToken = body.push_token;
    if (typeof pushToken !== "string" || pushToken.length === 0) {
      throw new ApiException("VALIDATION", 422, "push_token이 필요해요.", {
        field: "push_token",
      });
    }

    const admin = createSupabaseAdminClient();
    await logoutDevice(admin, user.id, pushToken);
    return new NextResponse(null, { status: 204 });
  }),
);
