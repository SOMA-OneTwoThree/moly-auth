import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiException } from "@/lib/http/api-exception";
import { deleteAccount } from "../service";

const userId = "verified-account";
const calls: string[] = [];
// RPC별 결과: 응답, 던질 오류, 또는 "hang"(abortSignal이 끊을 때까지 응답 없음).
type Outcome = { data: unknown; error: unknown } | Error | "hang";
let outcomes: Record<string, Outcome> = {};
type Builder = PromiseLike<unknown> & { abortSignal(signal: AbortSignal): Builder };
const rpc = vi.fn();
const deleteUser = vi.fn();
const admin = { rpc, auth: { admin: { deleteUser } } } as unknown as SupabaseClient;

// postgrest-js 빌더처럼 `.abortSignal()` 체이닝과 await를 모두 받는다.
function builderFor(fn: string): Builder {
  calls.push(fn);
  let signal: AbortSignal | undefined;
  const settle = (): Promise<unknown> => {
    const outcome = outcomes[fn] ?? { data: null, error: null };
    if (outcome instanceof Error) return Promise.reject(outcome);
    if (outcome !== "hang") return Promise.resolve(outcome);
    // postgrest-js는 끊긴 요청을 던지지 않고 error로 돌려준다(code는 빈 문자열).
    return new Promise((resolve) => {
      signal?.addEventListener("abort", () =>
        resolve({ data: null, error: { code: "", message: `${signal?.reason?.name}: aborted` } }),
      );
    });
  };
  const builder: Builder = {
    abortSignal(s) {
      signal = s;
      return builder;
    },
    then: (onFulfilled, onRejected) => settle().then(onFulfilled, onRejected),
  };
  return builder;
}

const timedOut = () => new DOMException("The operation was aborted due to timeout", "TimeoutError");

beforeEach(() => {
  calls.length = 0;
  outcomes = {};
  vi.clearAllMocks();
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  rpc.mockImplementation(builderFor);
  deleteUser.mockImplementation(async () => {
    calls.push("deleteUser");
    return { error: null };
  });
});

afterEach(() => vi.restoreAllMocks());

const operationOf = (fn: string) =>
  rpc.mock.calls.find(([name]) => name === fn)?.[1]?.p_operation_id as string | undefined;

describe("deleteAccount", () => {
  it("fences the account before deleting it, then cleans memories", async () => {
    await deleteAccount(admin, userId);
    expect(calls).toEqual(["begin_subject_deletion", "deleteUser", "delete_user_memories"]);
    expect(rpc).toHaveBeenCalledWith("begin_subject_deletion", {
      p_user_id: userId,
      p_operation_id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    expect(deleteUser).toHaveBeenCalledWith(userId);
  });

  it("still deletes the account when the fence call fails, logging only code and message", async () => {
    outcomes.begin_subject_deletion = {
      data: null,
      error: { code: "PGRST202", message: "Could not find the function", details: "stack trace" },
    };
    await deleteAccount(admin, userId);
    expect(calls).toEqual(["begin_subject_deletion", "deleteUser", "delete_user_memories"]);
    expect(console.warn).toHaveBeenCalledWith(
      "[begin_subject_deletion failed]", userId, "PGRST202", "Could not find the function",
    );
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain("stack trace");
  });

  it("still deletes the account when the fence call throws", async () => {
    outcomes.begin_subject_deletion = new Error("fetch failed");
    await deleteAccount(admin, userId);
    expect(calls).toEqual(["begin_subject_deletion", "deleteUser", "delete_user_memories"]);
    expect(console.warn).toHaveBeenCalledWith("[begin_subject_deletion failed]", userId, undefined, "fetch failed");
  });

  it("gives up on a slow fence call after 3 seconds and still deletes the account", async () => {
    const timeout = new AbortController();
    const requested = vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeout.signal);
    outcomes.begin_subject_deletion = "hang";
    const deletion = deleteAccount(admin, userId);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls).toEqual(["begin_subject_deletion"]); // waiting on the fence
    timeout.abort(timedOut());
    await deletion;
    expect(requested).toHaveBeenCalledWith(3000);
    expect(calls).toEqual(["begin_subject_deletion", "deleteUser", "delete_user_memories"]);
    expect(console.warn).toHaveBeenCalledWith("[begin_subject_deletion failed]", userId, "", "TimeoutError: aborted");
  }, 1000);

  it("lifts its own fence and fails when the account deletion fails", async () => {
    deleteUser.mockImplementation(async () => {
      calls.push("deleteUser");
      return { error: { status: 500, message: "auth unavailable" } };
    });
    const failure = deleteAccount(admin, userId);
    await expect(failure).rejects.toBeInstanceOf(ApiException);
    await expect(failure).rejects.toMatchObject({ code: "INTERNAL", status: 500 });
    expect(calls).toEqual(["begin_subject_deletion", "deleteUser", "abort_subject_deletion"]);
    expect(operationOf("abort_subject_deletion")).toBe(operationOf("begin_subject_deletion"));
  });

  it("keeps the 500 when lifting the fence also fails", async () => {
    deleteUser.mockResolvedValue({ error: { status: 500 } });
    outcomes.abort_subject_deletion = {
      data: null, error: { code: "57014", message: "canceling statement due to statement timeout" },
    };
    await expect(deleteAccount(admin, userId)).rejects.toMatchObject({ code: "INTERNAL" });
    expect(console.error).toHaveBeenCalledWith(
      "[abort_subject_deletion failed]", userId, "57014", "canceling statement due to statement timeout",
    );
  });

  it("gives up on a slow fence release and still answers 500", async () => {
    const timeout = new AbortController();
    vi.spyOn(AbortSignal, "timeout").mockReturnValue(timeout.signal);
    deleteUser.mockResolvedValue({ error: { status: 500 } });
    outcomes.abort_subject_deletion = "hang";
    const deletion = deleteAccount(admin, userId);
    const settled = vi.fn();
    deletion.then(settled, settled);
    await vi.waitFor(() => expect(calls).toContain("abort_subject_deletion"));
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(settled).not.toHaveBeenCalled(); // waiting on the release
    timeout.abort(timedOut());
    await expect(deletion).rejects.toMatchObject({ code: "INTERNAL", status: 500 });
    expect(console.error).toHaveBeenCalledWith("[abort_subject_deletion failed]", userId, "", "TimeoutError: aborted");
  }, 1000);

  it("completes even when memory cleanup fails", async () => {
    outcomes.delete_user_memories = { data: null, error: { code: "XX000" } };
    await expect(deleteAccount(admin, userId)).resolves.toBeUndefined();
  });
});
