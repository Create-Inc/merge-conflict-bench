import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mock the two imports the route file uses ─────────────────────────
const sqlMock = vi.fn();
const requireStaffMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/authz", () => ({ requireStaff: requireStaffMock }));

// ── import the resolved route handlers ───────────────────────────────
const mod = await import(
  "./resolved/apps/web/src/app/api/athletes/[id]/route.js"
);
const { PATCH, DELETE, OPTIONS } = mod;

// ── helpers ──────────────────────────────────────────────────────────
function makeRequest(body) {
  return {
    json: () => Promise.resolve(body),
  };
}

function makeParams(id) {
  return { params: { id } };
}

async function json(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: staff auth succeeds
  requireStaffMock.mockResolvedValue({ ok: true });
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("PATCH - auth gating (requireStaff)", () => {
    it("returns the gate error and status when requireStaff rejects", async () => {
      requireStaffMock.mockResolvedValue({
        ok: false,
        error: "Unauthorized",
        status: 401,
      });

      const res = await PATCH(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(401);
      const body = await json(res);
      expect(body.error).toBe("Unauthorized");
    });

    it("calls requireStaff (without superAdmin) for PATCH", async () => {
      requireStaffMock.mockResolvedValue({ ok: true });
      sqlMock.mockResolvedValue([{ id: 1 }]);

      await PATCH(makeRequest({ firstName: "A" }), makeParams("1"));
      // requireStaff should have been called (possibly with no args or empty obj)
      expect(requireStaffMock).toHaveBeenCalled();
      const callArg = requireStaffMock.mock.calls[0]?.[0];
      // It should NOT require super admin for PATCH
      expect(callArg?.requireSuperAdmin).toBeFalsy();
    });
  });

  describe("PATCH - id validation", () => {
    it("rejects non-numeric id with 400", async () => {
      const res = await PATCH(makeRequest({}), makeParams("abc"));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/invalid/i);
    });

    it("rejects zero id with 400", async () => {
      const res = await PATCH(makeRequest({}), makeParams("0"));
      expect(res.status).toBe(400);
    });

    it("rejects negative id with 400", async () => {
      const res = await PATCH(makeRequest({}), makeParams("-5"));
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH - no-op when no fields supplied", () => {
    it("returns ok:true, updated:false when body has no recognized fields", async () => {
      const res = await PATCH(makeRequest({}), makeParams("1"));
      const body = await json(res);
      expect(body.ok).toBe(true);
      expect(body.updated).toBe(false);
    });
  });

  describe("PATCH - successful update", () => {
    it("updates and returns ok:true, updated:true", async () => {
      // No email conflicts, then UPDATE returns a row
      sqlMock.mockResolvedValue([{ id: 1 }]);

      const res = await PATCH(
        makeRequest({ firstName: "Jane" }),
        makeParams("1"),
      );
      const body = await json(res);
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.updated).toBe(true);
    });

    it("returns 404 when update touches no rows", async () => {
      sqlMock.mockResolvedValue([]);

      const res = await PATCH(
        makeRequest({ firstName: "Jane" }),
        makeParams("999"),
      );
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH - phone unique constraint error", () => {
    it("returns 409 when contacts_phone_unique constraint fires", async () => {
      sqlMock.mockRejectedValue(
        new Error(
          'duplicate key value violates unique constraint "contacts_phone_unique"',
        ),
      );

      const res = await PATCH(
        makeRequest({ phone: "555-0100" }),
        makeParams("1"),
      );
      expect(res.status).toBe(409);
      const body = await json(res);
      expect(body.error).toMatch(/phone/i);
    });
  });

  describe("PATCH - dynamic SET clause", () => {
    it("builds update with only the fields that are provided", async () => {
      sqlMock.mockResolvedValue([{ id: 1 }]);

      // Use firstName only (no email) so we don't trigger email conflict queries
      await PATCH(makeRequest({ firstName: "Alex" }), makeParams("1"));

      const updateCall = sqlMock.mock.calls.find((c) =>
        c[0].includes("UPDATE"),
      );
      expect(updateCall).toBeDefined();
      // Should contain first_name = $<n>
      expect(updateCall[0]).toMatch(/first_name\s*=\s*\$/);
      // Should NOT contain email
      expect(updateCall[0]).not.toMatch(/email\s*=\s*\$/);
    });
  });

  describe("DELETE handler", () => {
    it("requires super admin auth", async () => {
      requireStaffMock.mockResolvedValue({
        ok: false,
        error: "Forbidden",
        status: 403,
      });

      const res = await DELETE(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(403);

      // Verify requireStaff was called with requireSuperAdmin: true
      expect(requireStaffMock).toHaveBeenCalledWith(
        expect.objectContaining({ requireSuperAdmin: true }),
      );
    });

    it("returns 400 for invalid id", async () => {
      const res = await DELETE(makeRequest({}), makeParams("bad"));
      expect(res.status).toBe(400);
    });

    it("returns 404 when athlete does not exist", async () => {
      sqlMock.mockResolvedValueOnce([]); // SELECT returns nothing

      const res = await DELETE(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(404);
    });

    it("deletes the athlete and returns ok:true", async () => {
      sqlMock.mockResolvedValueOnce([{ id: 1 }]); // SELECT finds the row
      sqlMock.mockResolvedValueOnce(undefined); // DELETE succeeds

      const res = await DELETE(makeRequest({}), makeParams("1"));
      const body = await json(res);
      expect(body.ok).toBe(true);

      // Verify a DELETE query was issued
      const deleteCall = sqlMock.mock.calls.find((c) =>
        c[0].includes("DELETE"),
      );
      expect(deleteCall).toBeDefined();
      expect(deleteCall[0]).toMatch(/contact_type\s*=\s*'athlete'/);
    });
  });

  describe("OPTIONS handler", () => {
    it("returns 204 with Allow header listing PATCH, DELETE, OPTIONS", async () => {
      const res = await OPTIONS();
      expect(res.status).toBe(204);
      const allow = res.headers.get("Allow");
      expect(allow).toContain("PATCH");
      expect(allow).toContain("DELETE");
      expect(allow).toContain("OPTIONS");
    });
  });

  describe("PATCH - safeText truncation", () => {
    it("truncates firstName to 80 chars", async () => {
      sqlMock.mockResolvedValue([{ id: 1 }]);
      const longName = "A".repeat(200);

      await PATCH(makeRequest({ firstName: longName }), makeParams("1"));

      const updateCall = sqlMock.mock.calls.find((c) =>
        c[0].includes("UPDATE"),
      );
      // The value passed for firstName should be truncated to 80
      expect(updateCall[1][0].length).toBe(80);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from the "ours" branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("PATCH - staff email conflict check blocks athlete from using staff email", () => {
    it("returns 409 with staff conflict info when email matches a staff contact", async () => {
      // First sql call: staff conflict check returns a row
      sqlMock.mockResolvedValueOnce([
        {
          id: 10,
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
        },
      ]);

      const res = await PATCH(
        makeRequest({ email: "admin@example.com" }),
        makeParams("1"),
      );
      expect(res.status).toBe(409);

      const body = await json(res);
      expect(body.code).toBe("EMAIL_IN_USE_BY_STAFF");
      expect(body.existingContact).toBeDefined();
      expect(body.existingContact.contactType).toBe("staff");
    });

    it("the staff conflict query filters on contact_type = 'staff'", async () => {
      sqlMock.mockResolvedValueOnce([]); // staff: no conflict
      sqlMock.mockResolvedValueOnce([]); // athlete: no conflict
      sqlMock.mockResolvedValueOnce([{ id: 1 }]); // UPDATE

      await PATCH(
        makeRequest({ email: "test@example.com" }),
        makeParams("1"),
      );

      // Find the staff conflict query
      const staffQuery = sqlMock.mock.calls.find(
        (c) => c[0].includes("staff") && c[0].includes("SELECT"),
      );
      expect(staffQuery).toBeDefined();
      expect(staffQuery[0]).toMatch(/contact_type\s*=\s*'staff'/);
    });
  });

  describe("PATCH - athlete email conflict check blocks duplicate athlete emails", () => {
    it("returns 409 with athlete conflict info when email matches another athlete", async () => {
      // Staff conflict: no match
      sqlMock.mockResolvedValueOnce([]);
      // Athlete conflict: match found
      sqlMock.mockResolvedValueOnce([
        {
          id: 20,
          first_name: "Other",
          last_name: "Athlete",
          email: "shared@example.com",
        },
      ]);

      const res = await PATCH(
        makeRequest({ email: "shared@example.com" }),
        makeParams("1"),
      );
      expect(res.status).toBe(409);

      const body = await json(res);
      // Code should indicate athlete email conflict
      expect(body.code).toMatch(/athlete/i);
      expect(body.existingContact).toBeDefined();
      expect(body.existingContact.contactType).toBe("athlete");
    });

    it("the athlete conflict query excludes the current contact id", async () => {
      sqlMock.mockResolvedValueOnce([]); // staff: no conflict
      sqlMock.mockResolvedValueOnce([]); // athlete: no conflict
      sqlMock.mockResolvedValueOnce([{ id: 5 }]); // UPDATE

      await PATCH(
        makeRequest({ email: "test@example.com" }),
        makeParams("5"),
      );

      // Find the athlete conflict query (contains 'athlete' and SELECT and id <>)
      const athleteQuery = sqlMock.mock.calls.find(
        (c) =>
          c[0].includes("athlete") &&
          c[0].includes("SELECT") &&
          c[0].includes("<>"),
      );
      expect(athleteQuery).toBeDefined();
      // The second parameter should be the current contact id (5)
      expect(athleteQuery[1]).toContain(5);
    });

    it("the athlete conflict query filters on contact_type = 'athlete'", async () => {
      sqlMock.mockResolvedValueOnce([]); // staff: no conflict
      sqlMock.mockResolvedValueOnce([]); // athlete: no conflict
      sqlMock.mockResolvedValueOnce([{ id: 1 }]); // UPDATE

      await PATCH(
        makeRequest({ email: "test@example.com" }),
        makeParams("1"),
      );

      const athleteQuery = sqlMock.mock.calls.find(
        (c) =>
          c[0].includes("SELECT") &&
          c[0].includes("<>") &&
          c[0].includes("athlete"),
      );
      expect(athleteQuery).toBeDefined();
      expect(athleteQuery[0]).toMatch(/contact_type\s*=\s*'athlete'/);
    });
  });

  describe("PATCH - parent emails are allowed (not blocked)", () => {
    it("succeeds when email only matches a parent contact (no staff or athlete conflicts)", async () => {
      // Staff conflict: no match
      sqlMock.mockResolvedValueOnce([]);
      // Athlete conflict: no match (parent contacts are not checked)
      sqlMock.mockResolvedValueOnce([]);
      // UPDATE succeeds
      sqlMock.mockResolvedValueOnce([{ id: 1 }]);

      const res = await PATCH(
        makeRequest({ email: "parent@example.com" }),
        makeParams("1"),
      );
      const body = await json(res);
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.updated).toBe(true);
    });
  });

  describe("PATCH - no email uniqueness constraint in catch (email not globally unique)", () => {
    it("does NOT catch contacts_email_unique as a known constraint", async () => {
      sqlMock.mockRejectedValue(
        new Error(
          'duplicate key value violates unique constraint "contacts_email_unique"',
        ),
      );

      const res = await PATCH(
        makeRequest({ email: "dup@example.com" }),
        makeParams("1"),
      );
      // Should fall through to generic 500, not a 409 with email-specific message
      expect(res.status).toBe(500);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from the "theirs" branch)
// =====================================================================
describe("theirs behaviors", () => {
  describe("PATCH - staff conflict check runs BEFORE athlete conflict check", () => {
    it("checks staff conflicts first; if staff conflict found, does not query athletes", async () => {
      sqlMock.mockResolvedValueOnce([
        {
          id: 99,
          first_name: "Staff",
          last_name: "Person",
          email: "staff@example.com",
        },
      ]);

      const res = await PATCH(
        makeRequest({ email: "staff@example.com" }),
        makeParams("1"),
      );
      expect(res.status).toBe(409);

      // sql should have been called only once (staff check). No athlete query follows.
      const selectCalls = sqlMock.mock.calls.filter((c) =>
        c[0].includes("SELECT"),
      );
      expect(selectCalls.length).toBe(1);
      expect(selectCalls[0][0]).toMatch(/staff/);
    });
  });

  describe("PATCH - conflict response includes existingContact with full shape", () => {
    it("staff conflict response includes id, contactType, firstName, lastName, email", async () => {
      sqlMock.mockResolvedValueOnce([
        {
          id: 10,
          first_name: "Jane",
          last_name: "Admin",
          email: "jane@staff.com",
        },
      ]);

      const res = await PATCH(
        makeRequest({ email: "jane@staff.com" }),
        makeParams("1"),
      );
      const body = await json(res);

      expect(body.existingContact).toMatchObject({
        contactType: "staff",
        firstName: "Jane",
        lastName: "Admin",
        email: "jane@staff.com",
      });
      // id should be a string
      expect(typeof body.existingContact.id).toBe("string");
    });

    it("athlete conflict response includes id, contactType, firstName, lastName, email", async () => {
      sqlMock.mockResolvedValueOnce([]); // no staff conflict
      sqlMock.mockResolvedValueOnce([
        {
          id: 20,
          first_name: "Bob",
          last_name: "Runner",
          email: "bob@athlete.com",
        },
      ]);

      const res = await PATCH(
        makeRequest({ email: "bob@athlete.com" }),
        makeParams("1"),
      );
      const body = await json(res);

      expect(body.existingContact).toMatchObject({
        contactType: "athlete",
        firstName: "Bob",
        lastName: "Runner",
        email: "bob@athlete.com",
      });
      expect(typeof body.existingContact.id).toBe("string");
    });
  });

  describe("PATCH - email check only fires when email is provided AND non-empty", () => {
    it("skips email conflict checks when email field is not in body", async () => {
      sqlMock.mockResolvedValue([{ id: 1 }]);

      await PATCH(makeRequest({ firstName: "Alex" }), makeParams("1"));

      // No SELECT queries for email conflict should have been made
      const selectCalls = sqlMock.mock.calls.filter((c) =>
        c[0].includes("SELECT"),
      );
      // The only sql call should be the UPDATE
      const emailCheckCalls = selectCalls.filter(
        (c) => c[0].includes("staff") || c[0].includes("<>"),
      );
      expect(emailCheckCalls.length).toBe(0);
    });

    it("skips email conflict checks when email is empty string", async () => {
      sqlMock.mockResolvedValue([{ id: 1 }]);

      await PATCH(
        makeRequest({ email: "", firstName: "Alex" }),
        makeParams("1"),
      );

      // safeText("") returns null, so email is falsy, and the conflict check is skipped
      const selectCalls = sqlMock.mock.calls.filter((c) =>
        c[0].includes("SELECT"),
      );
      const emailCheckCalls = selectCalls.filter(
        (c) => c[0].includes("staff") || c[0].includes("<>"),
      );
      expect(emailCheckCalls.length).toBe(0);
    });
  });

  describe("PATCH - UPDATE query scopes to contact_type = 'athlete'", () => {
    it("includes contact_type = 'athlete' in the WHERE clause of the UPDATE", async () => {
      sqlMock.mockResolvedValue([{ id: 1 }]);

      await PATCH(makeRequest({ firstName: "Test" }), makeParams("1"));

      const updateCall = sqlMock.mock.calls.find((c) =>
        c[0].includes("UPDATE"),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall[0]).toMatch(/contact_type\s*=\s*'athlete'/);
    });
  });

  describe("PATCH - generic error returns 500", () => {
    it("returns 500 with error message for unrecognized errors", async () => {
      sqlMock.mockRejectedValue(new Error("connection refused"));

      const res = await PATCH(
        makeRequest({ firstName: "Test" }),
        makeParams("1"),
      );
      expect(res.status).toBe(500);
      const body = await json(res);
      expect(body.error).toMatch(/connection refused/i);
    });
  });
});
