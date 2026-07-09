import { NextResponse } from "next/server";

/** GET /health — 공개 헬스체크(유일한 무인증 경로). */
export async function GET() {
  return NextResponse.json({ status: "ok", ts: new Date().toISOString() });
}
