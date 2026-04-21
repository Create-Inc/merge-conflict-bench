// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRequireActiveWorkspace = vi.fn();
vi.mock("@/app/api/utils/requireActiveWorkspace.js", () => ({
  default: (...args) => mockRequireActiveWorkspace(...args),
}));

const mockDbMany = vi.fn();
vi.mock("@/app/lib/server/db", () => ({
  dbMany: (...args) => mockDbMany(...args),
}));

const mockEmitTimeline = vi.fn(async () => {});
vi.mock("@/app/lib/server/timeline", () => ({
  emitTimeline: (...args) => mockEmitTimeline(...args),
}));

describe("GET /api/exports/compliance-blocks", () => {
  beforeEach(() => {
    mockRequireActiveWorkspace.mockReset();
    mockDbMany.mockReset();
    mockEmitTimeline.mockReset();

    mockRequireActiveWorkspace.mockResolvedValue({
      workspace: { id: "ws_1" },
      membership: { user_id: "user_1" },
    });
  });

  it("returns JSON rows", async () => {
    mockDbMany.mockResolvedValue([
      {
        id: "c_1",
        created_at: "2026-01-01T00:00:00.000Z",
        action_type: "email.send",
        channel: "email",
        recipient: "user@example.com",
        decision: "blocked",
        reason_code: "no_consent",
        run_id: "run_1",
        step_id: "step_1",
      },
    ]);

    const { GET } = await import("../compliance-blocks/route.js");
    const req = new Request(
      "http://localhost/api/exports/compliance-blocks?format=json&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );

    const res = await GET(req);

    expect(mockRequireActiveWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ minRoleKey: "owner" }),
    );

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0].decision).toBe("blocked");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany.mockResolvedValue([
      {
        id: "c_1",
        created_at: "2026-01-01T00:00:00.000Z",
        action_type: "email.send",
        channel: "email",
        recipient: "user@example.com",
        decision: "blocked",
        reason_code: "no_consent",
        run_id: "run_1",
        step_id: "step_1",
      },
    ]);

    const { GET } = await import("../compliance-blocks/route.js");
    const req = new Request(
      "http://localhost/api/exports/compliance-blocks?format=csv&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );

    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");

    const text = await res.text();
    expect(text.split("\n")[0]).toContain("decision");
    expect(text).toContain("no_consent");
  });
});
