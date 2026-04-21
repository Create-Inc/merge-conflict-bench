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

describe("GET /api/reports/access", () => {
  beforeEach(() => {
    mockRequireActiveWorkspace.mockReset();
    mockDbMany.mockReset();
    mockEmitTimeline.mockReset();

    mockRequireActiveWorkspace.mockResolvedValue({
      workspace: { id: "ws_1" },
      membership: { user_id: "user_1" },
    });
  });

  it("returns JSON report (memberships, roles, changes)", async () => {
    mockDbMany
      .mockResolvedValueOnce([
        {
          membership_id: "m_1",
          user_id: "u_1",
          email: "owner@example.com",
          name: "Owner",
          role_key: "owner",
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          key: "owner",
          name: "Owner",
          description: "Full access",
          is_system: true,
          created_at: "2026-01-01T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "a_1",
          created_at: "2026-01-01T00:00:00Z",
          action: "added",
          membership_id: "m_1",
          user_id: "u_1",
          old_role_key: null,
          new_role_key: "owner",
          old_status: null,
          new_status: "active",
        },
      ]);

    const { GET } = await import("../access/route.js");
    const res = await GET(new Request("http://localhost/api/reports/access"));

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.workspace_id).toBe("ws_1");
    expect(Array.isArray(body.memberships)).toBe(true);
    expect(body.memberships[0].role_key).toBe("owner");
    expect(body.memberships[0].can_export_audit).toBe(true);
    expect(Array.isArray(body.roles)).toBe(true);
    expect(Array.isArray(body.changes)).toBe(true);
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany
      .mockResolvedValueOnce([
        {
          membership_id: "m_1",
          user_id: "u_1",
          email: "owner@example.com",
          name: "Owner",
          role_key: "owner",
          status: "active",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { GET } = await import("../access/route.js");
    const res = await GET(
      new Request("http://localhost/api/reports/access?format=csv"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");

    const csv = await res.text();
    expect(csv.startsWith("membership_id,user_id,email")).toBe(true);
    expect(csv).toContain("owner@example.com");
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

describe("GET /api/reports/access", () => {
  beforeEach(() => {
    mockRequireActiveWorkspace.mockReset();
    mockDbMany.mockReset();
    mockEmitTimeline.mockReset();

    mockRequireActiveWorkspace.mockResolvedValue({
      workspace: { id: "ws_1" },
      membership: { user_id: "user_1" },
    });
  });

  it("returns JSON report", async () => {
    mockDbMany
      .mockResolvedValueOnce([
        {
          membership_id: "m_1",
          user_id: "user_1",
          email: "owner@example.com",
          name: "Owner",
          role_key: "owner",
          status: "active",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          key: "owner",
          name: "Owner",
          description: "Workspace owner",
          is_system: true,
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "evt_1",
          created_at: "2026-01-01T00:00:00.000Z",
          action: "added",
          membership_id: "m_1",
          user_id: "user_1",
          old_role_key: null,
          new_role_key: "owner",
          old_status: null,
          new_status: "active",
        },
      ]);

    const { GET } = await import("../access/route.js");
    const res = await GET(new Request("http://localhost/api/reports/access"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.workspace_id).toBe("ws_1");
    expect(body.memberships[0].can_export_audit).toBe(true);
    expect(Array.isArray(body.roles)).toBe(true);
    expect(Array.isArray(body.changes)).toBe(true);
    expect(mockEmitTimeline).toHaveBeenCalled();
  });

  it("returns CSV when format=csv", async () => {
    mockDbMany
      .mockResolvedValueOnce([
        {
          membership_id: "m_1",
          user_id: "user_1",
          email: "owner@example.com",
          name: "Owner",
          role_key: "owner",
          status: "active",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const { GET } = await import("../access/route.js");
    const res = await GET(
      new Request("http://localhost/api/reports/access?format=csv"),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
    const csv = await res.text();
    expect(csv.split("\n")[0]).toContain("membership_id");
    expect(csv).toContain("owner@example.com");
  });
});
>>>>>>> theirs
