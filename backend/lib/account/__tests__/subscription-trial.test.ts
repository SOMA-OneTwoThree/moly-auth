import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth/require-user";
import { startSubscriptionTrial } from "../service";
import { POST } from "@/app/subscription/trial/route";

vi.mock("@/lib/auth/require-user", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));
vi.mock("../service", () => ({ startSubscriptionTrial: vi.fn() }));

const user = { id: "server-verified-account" } as User;
const request = (body?: string) => new NextRequest("https://auth.example/subscription/trial", { method: "POST", body });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireUser).mockResolvedValue(user);
  vi.mocked(startSubscriptionTrial).mockResolvedValue({ entitlement: { plan: "trial" } } as never);
});

describe("POST /subscription/trial", () => {
  it("requires verified authentication before starting a trial", async () => {
    vi.mocked(requireUser).mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(startSubscriptionTrial).not.toHaveBeenCalled();
  });
  it("uses verified identity with an empty body", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(startSubscriptionTrial).toHaveBeenCalledWith({}, user);
    expect(await response.json()).toEqual({ entitlement: { plan: "trial" } });
  });
  it("rejects client-supplied user IDs and trial timestamps", async () => {
    const response = await POST(request(JSON.stringify({ user_id: "victim", trial_ends_at: "2099-01-01" })));
    expect(response.status).toBe(422);
    expect(startSubscriptionTrial).not.toHaveBeenCalled();
  });
});
