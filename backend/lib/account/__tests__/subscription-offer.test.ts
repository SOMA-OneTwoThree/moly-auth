import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { POST } from "@/app/subscription/offer/claim/route";

vi.mock("@/lib/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
const rpc = vi.fn();
const user = { id: "verified-account" } as User;
const req = (body: unknown) => new NextRequest("https://auth.example/subscription/offer/claim", {
  method: "POST", body: JSON.stringify(body),
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(user);
  vi.mocked(createSupabaseAdminClient).mockReturnValue({
    rpc,
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: user.id }, error: null }) }) }) }),
  } as never);
});

describe("subscription offer claim API", () => {
  it("authenticates before allocating a secret code", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(req({ platform: "ios", plan: "monthly" }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects unsupported selections and impersonated user IDs", async () => {
    expect((await POST(req({ platform: "ios", plan: "lifetime" }))).status).toBe(422);
    expect((await POST(req({ platform: "ios", plan: "monthly", user_id: "victim" }))).status).toBe(422);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("returns an encoded Apple URL without separately exposing the raw code", async () => {
    rpc.mockResolvedValue({ data: { apple_app_id: "12345", code: "ONE+TIME" }, error: null });
    const response = await POST(req({ platform: "ios", plan: "monthly" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ platform: "ios", plan: "monthly",
      redemption_url: "https://apps.apple.com/redeem?ctx=offercodes&id=12345&code=ONE%2BTIME" });
    expect(rpc).toHaveBeenCalledWith("claim_subscription_offer", {
      p_user_id: user.id, p_platform: "ios", p_plan: "monthly",
    });
  });
  it("returns the exact Play option selectors, never a longest-trial default", async () => {
    rpc.mockResolvedValue({ data: { product_id: "pro.yearly", base_plan_id: "yearly", offer_id: "legacy-month" }, error: null });
    const response = await POST(req({ platform: "android", plan: "yearly" }));
    expect(await response.json()).toEqual({ platform: "android", plan: "yearly", product_id: "pro.yearly",
      base_plan_id: "yearly", offer_id: "legacy-month" });
  });
  it("fails closed when the account is ineligible, inventory is empty or another plan is already claimed", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "offer unavailable" } });
    expect((await POST(req({ platform: "ios", plan: "yearly" }))).status).toBe(409);
  });
});
