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

describe("GET /api/exports/executions", () => {
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
        run_id: "run_1",
        run_created_at: "2026-01-01T00:00:00.000Z",
        run_updated_at: "2026-01-01T00:00:01.000Z",
        run_status: "succeeded",
        plan_type: "multi_action",
        run_error_code: null,
        run_error_message: null,
        is_dry_run: false,
        step_key: "s1",
        step_index: 0,
        step_type: "note.create",
        step_status: "succeeded",
        attempts: 1,
        started_at: "2026-01-01T00:00:00.000Z",
        finished_at: "2026-01-01T00:00:01.000Z",
        step_error_code: null,
        step_error_message: null,
      },
    ]);

    const { GET } = await import("../executions/route.js");
    const req = new Request(
      "http://localhost/api/exports/executions?format=json&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );
    const res = await GET(req);

    expect(mockRequireActiveWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({ minRoleKey: "owner" }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace_id).toBe("ws_1");
    expect(Array.isArray(body.rows)).toBe(true);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0].run_id).toBe("run_1");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany.mockResolvedValue([
      {
        run_id: "run_1",
        run_created_at: "2026-01-01T00:00:00.000Z",
        run_updated_at: "2026-01-01T00:00:01.000Z",
        run_status: "succeeded",
        plan_type: "multi_action",
        run_error_code: null,
        run_error_message: null,
        is_dry_run: false,
        step_key: "s1",
        step_index: 0,
        step_type: "note.create",
        step_status: "succeeded",
        attempts: 1,
        started_at: "2026-01-01T00:00:00.000Z",
        finished_at: "2026-01-01T00:00:01.000Z",
        step_error_code: null,
        step_error_message: null,
      },
    ]);

    const { GET } = await import("../executions/route.js");
    const req = new Request(
      "http://localhost/api/exports/executions?format=csv&start=2026-01-01T00:00:00.000Z&end=2026-01-02T00:00:00.000Z",
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");

    const disposition = res.headers.get("Content-Disposition") || "";
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("executions_ws_1");

    const text = await res.text();
    expect(text.split("\n")[0]).toContain("run_id");
    expect(text).toContain("run_1");
    expect(mockEmitTimeline).toHaveBeenCalled();
  });
});
