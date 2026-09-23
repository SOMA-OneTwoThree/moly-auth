import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "./with-auth";

// Exercise the installed Supabase SDK too: getUser returns many failures in
// `error` rather than throwing them. Mocking getUser would miss that contract.
const user = { id: "test-user", aud: "authenticated", is_anonymous: false };
const handler = vi.fn(async () => NextResponse.json({ ok: true }));
const request = (authorization = "Bearer test-token") =>
  new NextRequest("https://account.example.test/me", {
    headers: { authorization },
  });
const respond = (status: number, body: unknown) =>
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })));

beforeEach(() => {
  handler.mockClear();
  vi.stubEnv("SUPABASE_URL", "https://auth.example.test");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("withAuth with the real Supabase SDK", () => {
  it("passes the verified user to the protected handler", async () => {
    respond(200, user);
    expect((await withAuth(handler)(request())).status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.any(NextRequest), user);
  });

  it.each(["", "Basic token", "Bearer "])("rejects missing Bearer token: %s", async (header) => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect((await withAuth(handler)(request(header))).status).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    [401, undefined],
    [403, "bad_jwt"],
    [403, "user_not_found"],
    [403, "session_not_found"],
  ])("rejects invalid credentials (%s, %s)", async (status, code) => {
    respond(status as number, { msg: "invalid session", error_code: code });
    expect((await withAuth(handler)(request())).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("still rejects anonymous users", async () => {
    respond(200, { ...user, is_anonymous: true });
    expect((await withAuth(handler)(request())).status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([400, 404, 429, 500, 502, 503, 504, 522, 599])(
    "does not turn upstream %s into a session rejection",
    async (status) => {
      respond(status, { msg: "private upstream diagnostic" });
      const response = await withAuth(handler)(request());
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ error: {
        code: "INTERNAL",
        message: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
        details: {},
      } });
      expect(handler).not.toHaveBeenCalled();
    },
  );

  it("preserves the server-error path on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("network unavailable"); }));
    expect((await withAuth(handler)(request())).status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([200, 502])("does not treat malformed upstream JSON (%s) as an invalid session", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("unavailable", { status })));
    expect((await withAuth(handler)(request())).status).toBe(500);
    expect(handler).not.toHaveBeenCalled();
  });
});
