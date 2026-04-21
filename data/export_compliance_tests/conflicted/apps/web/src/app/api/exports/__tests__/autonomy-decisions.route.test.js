<<<<<<< ours
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

describe("GET /api/exports/autonomy-decisions", () => {
  beforeEach(() => {
    mockRequireActiveWorkspace.mockReset();
    mockDbMany.mockReset();
    mockEmitTimeline.mockReset();

    mockRequireActiveWorkspace.mockResolvedValue({
      workspace: { id: "ws_1" },
      membership: { user_id: "user_1" },
    });
  });

  it("returns JSON by default", async () => {
    mockDbMany.mockResolvedValue([
      {
        record_type: "execution",
        id: "log_1",
        created_at: "2026-01-01T00:00:00Z",
        action_type: "sms.send",
        outcome: "success",
        reason_code: "ok",
        confidence: 0.9,
        risk_tier: "low",
        run_id: "run_1",
        step_id: "step_1",
      },
    ]);

    const { GET } = await import("../autonomy-decisions/route.js");
    const res = await GET(
      new Request("http://localhost/api/exports/autonomy-decisions"),
    );

    expect(mockRequireActiveWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ minRoleKey: "owner" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace_id).toBe("ws_1");
    expect(body.rows[0].record_type).toBe("execution");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany.mockResolvedValue([
      {
        record_type: "action",
        id: "log_2",
        created_at: "2026-01-01T00:00:00Z",
        action_type: "task.create",
        outcome: null,
        reason_code: null,
        confidence: null,
        risk_tier: null,
        run_id: null,
        step_id: null,
      },
    ]);

    const { GET } = await import("../autonomy-decisions/route.js");
    const url =
      "http://localhost/api/exports/autonomy-decisions?format=csv&start=2026-01-01T00:00:00.000Z&end=2026-01-02T23:59:59.999Z";
    const res = await GET(new Request(url));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");

    const csv = await res.text();
    expect(csv.startsWith("record_type,id,created_at")).toBe(true);
    expect(csv).toContain("log_2");
  });
});
=======
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

describe("GET /api/exports/autonomy-decisions", () => {
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
        record_type: "execution",
        id: "e_1",
        created_at: "2026-01-01T00:00:00.000Z",
        action_type: "sms.send",
        outcome: "success",
        reason_code: "ok",
        confidence: 0.9,
        risk_tier: "low",
        run_id: "run_1",
        step_id: "step_1",
      },
    ]);

    const { GET } = await import("../autonomy-decisions/route.js");
    const req = new Request(
      "http://localhost/api/exports/autonomy-decisions?format=json&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace_id).toBe("ws_1");
    expect(body.rows.length).toBe(1);
    expect(body.rows[0].record_type).toBe("execution");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany.mockResolvedValue([
      {
        record_type: "action",
        id: "a_1",
        created_at: "2026-01-01T00:00:00.000Z",
        action_type: "call.place",
        outcome: null,
        reason_code: null,
        confidence: null,
        risk_tier: null,
        run_id: "run_1",
        step_id: "step_1",
      },
    ]);

    const { GET } = await import("../autonomy-decisions/route.js");
    const req = new Request(
      "http://localhost/api/exports/autonomy-decisions?format=csv&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");

    const text = await res.text();
    expect(text.split("\n")[0]).toContain("record_type");
    expect(text).toContain("a_1");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });
});
>>>>>>> theirs
