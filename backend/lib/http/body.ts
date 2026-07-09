import type { NextRequest } from "next/server";
import { ApiException } from "./api-exception";

/**
 * JSON 본문 파싱 — 깨진 JSON/비객체는 400 BAD_REQUEST.
 * allowEmpty: PATCH처럼 "보낸 필드만 반영" 의미론에서 빈 본문 = {} 로 취급.
 */
export async function parseJsonObject(
  req: NextRequest,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): Promise<Record<string, unknown>> {
  const text = await req.text();
  if (allowEmpty && text.trim() === "") return {};
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ApiException("BAD_REQUEST", 400, "요청 본문이 올바른 JSON이 아니에요.");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiException("BAD_REQUEST", 400, "요청 본문은 JSON 객체여야 해요.");
  }
  return body as Record<string, unknown>;
}

/** 미정의 필드 거부(심층방어) — moly-backend pydantic extra="forbid"와 동일. */
export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new ApiException("VALIDATION", 422, "알 수 없는 필드가 있어요.", {
      unknown_fields: unknown,
    });
  }
}
