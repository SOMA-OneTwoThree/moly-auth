import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  deleteAccount,
  getMe,
  patchMe,
  type PatchMeInput,
} from "@/lib/account/service";
import {
  isValidLanguage,
  isValidNickname,
  isValidTimezone,
} from "@/lib/account/validation";

export const runtime = "nodejs";

/** GET /me — 앱 진입 시 1회, 부팅 집계(profile·entitlement·wallet·equipment). */
export const GET = withAuth(
  handle(async (req, user) => {
    const admin = createSupabaseAdminClient();
    return NextResponse.json(await getMe(admin, user));
  }),
);

/** PATCH /me — 닉네임·언어·타임존 변경(보낸 필드만). */
export const PATCH = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["nickname", "language", "timezone"]);

    const input: PatchMeInput = {};
    if (body.nickname !== undefined) {
      if (!isValidNickname(body.nickname)) {
        throw new ApiException("VALIDATION", 422, "닉네임은 1~10자여야 해요.", {
          field: "nickname",
        });
      }
      input.nickname = body.nickname;
    }
    if (body.language !== undefined) {
      if (!isValidLanguage(body.language)) {
        throw new ApiException("VALIDATION", 422, "유효하지 않은 언어 코드예요.", {
          field: "language",
        });
      }
      input.language = body.language;
    }
    if (body.timezone !== undefined) {
      if (!isValidTimezone(body.timezone)) {
        throw new ApiException("VALIDATION", 422, "유효하지 않은 타임존이에요.", {
          field: "timezone",
        });
      }
      input.timezone = body.timezone;
    }

    const admin = createSupabaseAdminClient();
    return NextResponse.json(await patchMe(admin, user, input));
  }),
);

/** DELETE /me — 회원탈퇴. auth.users 삭제(CASCADE) + mem0 정리 후 204. */
export const DELETE = withAuth(
  handle(async (req, user) => {
    const admin = createSupabaseAdminClient();
    await deleteAccount(admin, user.id);
    return new NextResponse(null, { status: 204 });
  }),
);
