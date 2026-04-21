// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireActiveWorkspace = vi.fn();
vi.mock("@/app/api/utils/requireActiveWorkspace.js", () => ({
  default: (...args) => mockRequireActiveWorkspace(...args),
}));

const mockDbOne = vi.fn();
vi.mock("@/app/lib/server/db", () => ({
  dbOne: (...args) => mockDbOne(...args),
}));

const mockEmitTimeline = vi.fn(async () => {});
vi.mock("@/app/lib/server/timeline", () => ({
  emitTimeline: (...args) => mockEmitTimeline(...args),
}));

describe("GET/PATCH /api/settings/retention", () => {
  beforeEach(() => {
    mockRequireActiveWorkspace.mockReset();
    mockDbOne.mockReset();
    mockEmitTimeline.mockReset();

    mockRequireActiveWorkspace.mockResolvedValue({
      workspace: { id: "ws_1" },
      membership: { user_id: "user_1" },
    });
  });

  it("GET creates policy if missing", async () => {
    mockDbOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      workspace_id: "ws_1",
      transcripts_days: 90,
      logs_days: 365,
      diagnostics_days: 90,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });

    const { GET } = await import("../retention/route.js");
    const res = await GET(new Request("http://localhost/api/settings/retention"));

    expect(mockRequireActiveWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ minRoleKey: "owner" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.policy.workspace_id).toBe("ws_1");
    expect(mockDbOne).toHaveBeenCalledTimes(2);
  });

  it("PATCH clamps values and emits timeline", async () => {
    mockDbOne
      .mockResolvedValueOnce({
        workspace_id: "ws_1",
        transcripts_days: 90,
        logs_days: 365,
        diagnostics_days: 90,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      })
      .mockResolvedValueOnce({
        workspace_id: "ws_1",
        transcripts_days: 3650,
        logs_days: 0,
        diagnostics_days: 1,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      });

    const { PATCH } = await import("../retention/route.js");
    const req = new Request("http://localhost/api/settings/retention", {
      method: "PATCH",
      body: JSON.stringify({
        transcripts_days: 999999,
        logs_days: -5,
        diagnostics_days: 1.2,
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.policy.transcripts_days).toBe(3650);
    expect(body.policy.logs_days).toBe(0);
    expect(body.policy.diagnostics_days).toBe(1);
    expect(mockEmitTimeline).toHaveBeenCalled();

    const updateCall = mockDbOne.mock.calls[1];
    expect(updateCall[1]).toEqual(["ws_1", 3650, 0, 1]);
  });
});
