import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { handle } from "@/lib/http/api-exception";
import { parseJsonObject, rejectUnknownFields } from "@/lib/http/body";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { startSubscriptionTrial } from "@/lib/account/service";

export const runtime = "nodejs";

export const POST = withAuth(handle(async (req, user) => {
  const body = await parseJsonObject(req, { allowEmpty: true });
  rejectUnknownFields(body, []);
  return NextResponse.json(await startSubscriptionTrial(createSupabaseAdminClient(), user));
}));
