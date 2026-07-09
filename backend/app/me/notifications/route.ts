import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle, ApiException } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getNotifications,
  patchNotifications,
  type NotificationsPatchInput,
} from "@/lib/account/service";

export const runtime = "nodejs";

/** GET /me/notifications — 알림 2종(morning_diary·evening_chat) on/off. 미설정 = true. */
export const GET = withAuth(
  handle(async (req, user) => {
    const admin = createSupabaseAdminClient();
    return NextResponse.json(await getNotifications(admin, user.id));
  }),
);

/** PATCH /me/notifications — 보낸 항목만 반영. */
export const PATCH = withAuth(
  handle(async (req, user) => {
    const body = await parseJsonObject(req);
    rejectUnknownFields(body, ["morning_diary", "evening_chat"]);

    const input: NotificationsPatchInput = {};
    for (const key of ["morning_diary", "evening_chat"] as const) {
      const v = body[key];
      if (v === undefined) continue;
      if (typeof v !== "boolean") {
        throw new ApiException("VALIDATION", 422, "알림 설정 값은 true/false여야 해요.", {
          field: key,
        });
      }
      input[key] = v;
    }

    const admin = createSupabaseAdminClient();
    return NextResponse.json(await patchNotifications(admin, user.id, input));
  }),
);
