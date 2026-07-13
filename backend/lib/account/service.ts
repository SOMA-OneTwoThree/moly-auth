/**
 * 계정 서비스 — API_SPEC 2장(온보딩·/me·알림·푸시토큰·로그아웃·탈퇴).
 * moly-backend(app/services/account*.py)에서 이관(2026-07-09).
 *
 * 데이터 접근은 전부 admin(service_role) 클라이언트 — RLS를 우회하므로
 * 모든 쿼리는 반드시 검증된 `user.id`로만 스코프한다(IDOR 방지).
 */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { ApiException } from "@/lib/http/api-exception";
import { activityDateFor } from "./time";
import {
  deriveEntitlement,
  effectiveTokenConfig,
  type ActiveSubscription,
  type Entitlement,
  type ProfileRow,
  type TokenConfig,
} from "./entitlement";

const NOTIF_TYPES = ["morning_diary", "evening_chat"] as const; // 알림 2종 고정
const MEMORY_TABLE = "memories"; // mem0 collection (moly-backend settings.memory_collection)

const PROFILE_COLUMNS =
  "id, nickname, language, timezone, hay_balance, trial_ends_at, review_prompted_at";

function notFound(message: string): ApiException {
  return new ApiException("NOT_FOUND", 404, message);
}

function internal(message: string): ApiException {
  return new ApiException("INTERNAL", 500, message);
}

// ── 프로필 ──────────────────────────────────────────────────────────

/**
 * auth.users → public.profiles 보장(self-heal).
 *
 * 주 경로는 DB 가입 트리거(on_auth_user_created)지만, 트리거 이전 가입자·트리거
 * 유실 같은 경우에도 계정이 막히지 않도록, 조회 시 없으면 트리거와 같은
 * DB bootstrap_user RPC로 프로필·기본 꾸미기 3종·theme_default 장착·기본 루틴을
 * 한 트랜잭션에서 생성한다. 부분 초기화된 계정은 허용하지 않는다.
 */
export async function ensureProfile(
  admin: SupabaseClient,
  user: User,
): Promise<ProfileRow> {
  const found = await loadProfile(admin, user.id);
  if (found) return found;

  const { error } = await admin.rpc("bootstrap_user", {
    p_user_id: user.id,
    p_created_at: user.created_at,
  });
  if (error) {
    console.error("[bootstrap_user self-heal]", error);
    throw internal("프로필 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }

  const created = await loadProfile(admin, user.id);
  if (!created) throw internal("프로필 생성에 실패했어요. 잠시 후 다시 시도해 주세요.");
  return created;
}

async function loadProfile(
  admin: SupabaseClient,
  userId: string,
): Promise<ProfileRow | null> {
  const { data, error } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    console.error("[profiles select]", error);
    throw internal("프로필 조회에 실패했어요.");
  }
  return data as ProfileRow | null;
}

function profileBlock(profile: ProfileRow) {
  return {
    nickname: profile.nickname,
    timezone: profile.timezone,
    language: profile.language,
    onboarded: profile.nickname !== null,
  };
}

// ── entitlement 재료 로드 ────────────────────────────────────────────

async function loadActiveSubscription(
  admin: SupabaseClient,
  userId: string,
  now: Date,
): Promise<ActiveSubscription | null> {
  const { data, error } = await admin
    .from("subscriptions")
    .select("plan, expires_at")
    .eq("user_id", userId)
    .in("status", ["active", "grace_period"])
    .gt("expires_at", now.toISOString())
    .order("expires_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error("[subscriptions select]", error);
    throw internal("구독 조회에 실패했어요.");
  }
  return (data?.[0] as ActiveSubscription | undefined) ?? null;
}

async function loadTokensUsed(
  admin: SupabaseClient,
  userId: string,
  activityDate: string,
): Promise<number> {
  const { data, error } = await admin
    .from("user_daily_stats")
    .select("tokens_used")
    .eq("user_id", userId)
    .eq("activity_date", activityDate)
    .maybeSingle();
  if (error) {
    console.error("[user_daily_stats select]", error);
    throw internal("사용량 조회에 실패했어요.");
  }
  return data?.tokens_used ?? 0;
}

async function loadTokenConfig(admin: SupabaseClient): Promise<TokenConfig> {
  const { data, error } = await admin
    .from("app_config")
    .select("key, value")
    .in("key", [
      "daily_token_limit",
      "diary_llm_min_tokens",
      "free_launch_until",
      "free_launch_token_limit",
    ]);
  if (error) {
    console.error("[app_config select]", error);
    throw internal("설정 조회에 실패했어요.");
  }
  const values: Record<string, unknown> = {};
  for (const row of data ?? []) values[row.key] = row.value;
  return effectiveTokenConfig(values);
}

async function buildEntitlement(
  admin: SupabaseClient,
  profile: ProfileRow,
  now: Date,
): Promise<Entitlement> {
  const activityDate = activityDateFor(now, profile.timezone);
  const [sub, tokensUsed, config] = await Promise.all([
    loadActiveSubscription(admin, profile.id, now),
    loadTokensUsed(admin, profile.id, activityDate),
    loadTokenConfig(admin),
  ]);
  return deriveEntitlement(profile, sub, tokensUsed, config, now);
}

type EquipmentProduct = { public_id: string; is_active: boolean };
type EquipmentRow = {
  equipped_slot: string;
  products: EquipmentProduct | EquipmentProduct[] | null;
};

export async function loadEquipment(
  admin: SupabaseClient,
  userId: string,
): Promise<Record<string, string>> {
  // 스키마 리팩토링(moly-backend docs/DB_REFACTOR.md): user_equipment → user_items 통합.
  // 장착 = equipped_slot NOT NULL 행(슬롯당 1행은 부분 UNIQUE가 보장).
  // is_active는 쿼리로 거르지 않는다 — 비활성 상품이 장착돼 있으면 슬롯을 조용히 빠뜨리는 대신
  // moly-backend GET /inventory/equipment와 똑같이 실패해야 두 응답이 갈리지 않는다(핸드오프 §6).
  // FK를 반드시 이름으로 지목한다: user_items → products 관계가 product_id_fkey와
  // 복합 product_slot_fk 둘이라, 이름 없이 임베드하면 PostgREST가 PGRST201로 거부한다.
  const { data, error } = await admin
    .from("user_items")
    .select("equipped_slot, products!user_items_product_id_fkey(public_id, is_active)")
    .eq("user_id", userId)
    .not("equipped_slot", "is", null);
  if (error) {
    console.error("[user_items equipped select]", error);
    throw internal("장착 상태 조회에 실패했어요.");
  }
  const bySlot: Record<string, string> = {};
  for (const row of (data ?? []) as EquipmentRow[]) {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    if (!product?.public_id || !product.is_active) {
      throw internal("장착 상품이 활성 카탈로그에 없습니다.");
    }
    bySlot[row.equipped_slot] = product.public_id;
  }
  if (!bySlot.theme) {
    throw internal("기본 테마 장착 상태가 없습니다.");
  }
  return bySlot;
}

// ── GET /me · POST /onboarding · PATCH /me ──────────────────────────

export async function getMe(admin: SupabaseClient, user: User) {
  const profile = await ensureProfile(admin, user);
  const now = new Date();
  const [entitlement, equipment] = await Promise.all([
    buildEntitlement(admin, profile, now),
    loadEquipment(admin, user.id),
  ]);
  return {
    profile: profileBlock(profile),
    entitlement,
    wallet: { balance: profile.hay_balance },
    equipment: {
      theme_id: equipment["theme"],
      head_id: equipment["head"] ?? null,
      neck_id: equipment["neck"] ?? null,
      body_id: equipment["body"] ?? null,
    },
  };
}

export type OnboardingInput = {
  nickname: string;
  timezone: string;
  language: string;
};

export async function onboard(
  admin: SupabaseClient,
  user: User,
  input: OnboardingInput,
) {
  const profile = await ensureProfile(admin, user);
  // 온보딩은 1회만 — 이미 완료(nickname 존재)면 거부(재시도·중복탭·위조 방어).
  if (profile.nickname !== null) {
    throw new ApiException("ALREADY_ONBOARDED", 409, "이미 온보딩을 완료했어요.");
  }
  const updated = await updateProfile(admin, user.id, input);
  const entitlement = await buildEntitlement(admin, updated, new Date());
  return { profile: profileBlock(updated), entitlement };
}

export type PatchMeInput = {
  nickname?: string;
  language?: string;
  timezone?: string;
};

export async function patchMe(
  admin: SupabaseClient,
  user: User,
  input: PatchMeInput,
) {
  const profile = await loadProfile(admin, user.id);
  if (!profile) throw notFound("프로필을 찾을 수 없어요.");
  const updated =
    Object.keys(input).length === 0
      ? profile
      : await updateProfile(admin, user.id, input);
  return { profile: profileBlock(updated) };
}

async function updateProfile(
  admin: SupabaseClient,
  userId: string,
  fields: PatchMeInput,
): Promise<ProfileRow> {
  const { data, error } = await admin
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error || !data) {
    console.error("[profiles update]", error);
    throw internal("프로필 저장에 실패했어요.");
  }
  return data as ProfileRow;
}

// ── 알림 설정 (행 없으면 기본 on) ────────────────────────────────────

export async function getNotifications(
  admin: SupabaseClient,
  userId: string,
): Promise<Record<string, boolean>> {
  const { data, error } = await admin
    .from("user_notification_settings")
    .select("type, enabled")
    .eq("user_id", userId);
  if (error) {
    console.error("[notification_settings select]", error);
    throw internal("알림 설정 조회에 실패했어요.");
  }
  const stored = new Map((data ?? []).map((r) => [r.type, r.enabled]));
  return Object.fromEntries(NOTIF_TYPES.map((t) => [t, stored.get(t) ?? true]));
}

export type NotificationsPatchInput = {
  morning_diary?: boolean;
  evening_chat?: boolean;
};

export async function patchNotifications(
  admin: SupabaseClient,
  userId: string,
  input: NotificationsPatchInput,
): Promise<Record<string, boolean>> {
  const rows = NOTIF_TYPES.flatMap((t) =>
    input[t] === undefined ? [] : [{ user_id: userId, type: t, enabled: input[t] }],
  );
  if (rows.length > 0) {
    const { error } = await admin
      .from("user_notification_settings")
      .upsert(rows, { onConflict: "user_id,type" });
    if (error) {
      console.error("[notification_settings upsert]", error);
      throw internal("알림 설정 저장에 실패했어요.");
    }
  }
  return getNotifications(admin, userId);
}

// ── 푸시 토큰 · 로그아웃 ─────────────────────────────────────────────

export async function registerPushToken(
  admin: SupabaseClient,
  userId: string,
  token: string,
  platform: string,
): Promise<void> {
  // push_token UNIQUE — 다른 계정에 붙어있던 토큰이면 이 유저로 재귀속(기기 이전:
  // 같은 기기에서 계정 전환 시 필수. moly-backend 원 구현과 동일 의미론).
  // 트레이드오프: 타인의 APNs 토큰 값을 알면 재귀속 가능하나, 토큰은 고엔트로피
  // 비밀값이라 허용(보안 리뷰 2026-07-09 — 유출 경로가 생기면 재검토).
  const { error } = await admin.from("user_devices").upsert(
    {
      user_id: userId,
      platform,
      push_token: token,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: "push_token" },
  );
  if (error) {
    console.error("[user_devices upsert]", error);
    throw internal("푸시 토큰 등록에 실패했어요.");
  }
}

export async function logoutDevice(
  admin: SupabaseClient,
  userId: string,
  pushToken: string,
): Promise<void> {
  // 해당 토큰 + 본인 것만 삭제(멀티 기기 안전). 세션 종료는 클라 Supabase signOut.
  const { error } = await admin
    .from("user_devices")
    .delete()
    .eq("push_token", pushToken)
    .eq("user_id", userId);
  if (error) {
    console.error("[user_devices delete]", error);
    throw internal("로그아웃 처리에 실패했어요.");
  }
}

// ── 탈퇴 ────────────────────────────────────────────────────────────

/**
 * 회원탈퇴(US-106): auth.users 삭제 → 전 테이블 CASCADE.
 * mem0 기억은 FK 밖이라 별도 정리(ERD §7) — 실패해도 탈퇴는 완료.
 * 자동 재시도는 없다(서버리스): 실패는 로그(`[mem0 cleanup failed]`)로 남고
 * 런북(ARCHITECTURE §8)에 따라 수동/배치 정리한다.
 */
export async function deleteAccount(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.error("[auth deleteUser]", error);
    throw internal("탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
  }
  await deleteMemories(admin, userId);
}

/**
 * mem0 pgvector 행 직접 삭제 — TS에는 mem0 SDK가 없어 테이블을 직접 지운다.
 * (mem0의 로컬 history SQLite는 비권위 캐시라 무관 — moly-backend ERD §7 참고)
 */
async function deleteMemories(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  try {
    const { error } = await admin
      .from(MEMORY_TABLE)
      .delete()
      .filter("metadata->>user_id", "eq", userId);
    if (error) throw error;
  } catch (e) {
    // 탈퇴 자체는 완료 — mem0 정리 실패만 로그(런북 따라 수동 정리 대상).
    console.warn("[mem0 cleanup failed]", userId, e);
  }
}
