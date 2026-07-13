import type { SupabaseClient, User } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { ensureProfile, loadEquipment } from "../service";

function equipmentAdmin(rows: unknown[]): SupabaseClient {
  const filter = {
    eq: vi.fn(),
    not: vi.fn(async () => ({ data: rows, error: null })),
  };
  filter.eq.mockReturnValue(filter);
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => filter),
    })),
  } as unknown as SupabaseClient;
}

describe("appearance v2 account aggregation", () => {
  it("장착 상품 UUID 대신 products.public_id를 반환한다", async () => {
    const equipment = await loadEquipment(equipmentAdmin([
      { equipped_slot: "theme", products: { public_id: "theme_default", is_active: true } },
      { equipped_slot: "head", products: { public_id: "head_sunglasses", is_active: true } },
    ]), "user-1");

    expect(equipment).toEqual({
      theme: "theme_default",
      head: "head_sunglasses",
    });
  });

  it("theme 장착 누락을 null로 숨기지 않는다", async () => {
    await expect(loadEquipment(equipmentAdmin([]), "user-1")).rejects.toMatchObject({
      code: "INTERNAL",
      status: 500,
    });
  });

  it("비활성 상품이 장착돼 있으면 슬롯을 빠뜨리지 않고 실패한다", async () => {
    // moly-backend GET /inventory/equipment도 같은 상태에서 500이다 — 두 응답이 갈리면 안 된다.
    await expect(loadEquipment(equipmentAdmin([
      { equipped_slot: "theme", products: { public_id: "theme_default", is_active: true } },
      { equipped_slot: "head", products: { public_id: "head_mandarin", is_active: false } },
    ]), "user-1")).rejects.toMatchObject({ code: "INTERNAL", status: 500 });
  });

  it("프로필 self-heal은 원자적 bootstrap_user RPC를 호출한다", async () => {
    const profile = {
      id: "user-1",
      nickname: null,
      language: "ko",
      timezone: "Asia/Seoul",
      hay_balance: 0,
      trial_ends_at: "2026-07-15T00:00:00Z",
      review_prompted_at: null,
    };
    let profileReads = 0;
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const admin = {
      rpc,
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: profileReads++ === 0 ? null : profile,
              error: null,
            })),
          })),
        })),
      })),
    } as unknown as SupabaseClient;
    const user = {
      id: "user-1",
      created_at: "2026-07-13T00:00:00Z",
    } as User;

    await expect(ensureProfile(admin, user)).resolves.toMatchObject({ id: "user-1" });
    expect(rpc).toHaveBeenCalledWith("bootstrap_user", {
      p_user_id: "user-1",
      p_created_at: "2026-07-13T00:00:00Z",
    });
  });
});
