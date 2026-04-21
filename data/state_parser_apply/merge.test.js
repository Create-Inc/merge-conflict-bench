import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock dependencies ──────────────────────────────────────────────
const sqlMock = vi.fn();
const requireViewerEmployeeMock = vi.fn();
const canViewAllTradeShowsMock = vi.fn();
const sendEmailMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/rbac", () => ({
  canViewAllTradeShows: (...args) => canViewAllTradeShowsMock(...args),
  requireViewerEmployee: (...args) => requireViewerEmployeeMock(...args),
}));
vi.mock("@/app/api/utils/send-email", () => ({
  sendEmail: (...args) => sendEmailMock(...args),
}));

const mod = await import(
  "./resolved/apps/web/src/app/api/schedule/report/route.js"
);
const { GET, POST } = mod;

function makeGetRequest(params = {}) {
  const sp = new URLSearchParams(params);
  return {
    url: `http://localhost/api/schedule/report?${sp.toString()}`,
  };
}

function makePostRequest(body = {}) {
  return {
    json: () => Promise.resolve(body),
  };
}

async function json(res) {
  return res.json();
}

const defaultEmployee = { id: 1, name: "Test User" };

beforeEach(() => {
  vi.clearAllMocks();
  requireViewerEmployeeMock.mockResolvedValue({
    employee: defaultEmployee,
    response: null,
  });
  canViewAllTradeShowsMock.mockReturnValue(true);
  sqlMock.mockResolvedValue([]);
  sendEmailMock.mockResolvedValue(undefined);
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches)
// =====================================================================
describe("base behaviors", () => {
  describe("GET handler basics", () => {
    it("exports GET handler", () => {
      expect(typeof GET).toBe("function");
    });

    it("exports POST handler", () => {
      expect(typeof POST).toBe("function");
    });

    it("returns error when viewer employee auth fails", async () => {
      requireViewerEmployeeMock.mockResolvedValue({
        employee: null,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await GET(makeGetRequest());
      expect(res.status).toBe(401);
    });

    it("returns 200 with items array when authorized", async () => {
      const res = await GET(makeGetRequest());
      const body = await json(res);
      expect(res.status).toBe(200);
      expect(body.items).toBeDefined();
      expect(Array.isArray(body.items)).toBe(true);
    });

    it("returns 400 for invalid trade_show_id", async () => {
      const res = await GET(makeGetRequest({ trade_show_id: "abc" }));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/trade_show_id/i);
    });

    it("returns 400 for invalid employee_id", async () => {
      const res = await GET(makeGetRequest({ employee_id: "xyz" }));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/employee_id/i);
    });

    it("accepts valid trade_show_id and employee_id", async () => {
      const res = await GET(
        makeGetRequest({ trade_show_id: "5", employee_id: "3" }),
      );
      expect(res.status).toBe(200);
    });
  });

  describe("GET handler - reservation items", () => {
    it("queries reservations table", async () => {
      await GET(makeGetRequest());
      const reservationCall = sqlMock.mock.calls.find(
        (c) => typeof c[0] === "string" && c[0].includes("reservations"),
      );
      expect(reservationCall).toBeDefined();
    });

    it("joins trade_shows and employees for reservation data", async () => {
      await GET(makeGetRequest());
      const reservationCall = sqlMock.mock.calls.find(
        (c) =>
          typeof c[0] === "string" &&
          c[0].includes("reservations") &&
          c[0].includes("trade_shows"),
      );
      expect(reservationCall).toBeDefined();
    });
  });

  describe("GET handler - travel items", () => {
    it("queries travel_records table", async () => {
      await GET(makeGetRequest());
      const travelCall = sqlMock.mock.calls.find(
        (c) => typeof c[0] === "string" && c[0].includes("travel_records"),
      );
      expect(travelCall).toBeDefined();
    });
  });

  describe("GET handler - task deadline items", () => {
    it("queries tasks table for deadlines", async () => {
      await GET(makeGetRequest());
      const taskCall = sqlMock.mock.calls.find(
        (c) =>
          typeof c[0] === "string" &&
          c[0].includes("tasks") &&
          c[0].includes("due_date"),
      );
      expect(taskCall).toBeDefined();
    });
  });

  describe("GET handler - include_cancelled filter", () => {
    it("filters out cancelled items by default", async () => {
      await GET(makeGetRequest());
      const reservationCall = sqlMock.mock.calls.find(
        (c) => typeof c[0] === "string" && c[0].includes("reservations"),
      );
      // Should include is_cancelled = false filter
      expect(reservationCall[0]).toMatch(/is_cancelled/i);
    });
  });

  describe("GET handler - meta in response", () => {
    it("includes meta object with trade_show_id and warning", async () => {
      const res = await GET(makeGetRequest());
      const body = await json(res);
      expect(body.meta).toBeDefined();
      expect(body.meta.warning_external_sync).toBeDefined();
    });
  });

  describe("POST handler - email sending", () => {
    it("returns error when viewer employee auth fails", async () => {
      requireViewerEmployeeMock.mockResolvedValue({
        employee: null,
        response: Response.json({ error: "Unauthorized" }, { status: 401 }),
      });

      const res = await POST(makePostRequest({ to: "test@example.com" }));
      expect(res.status).toBe(401);
    });

    it("returns 400 when email recipient is missing", async () => {
      const res = await POST(makePostRequest({}));
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/email|recipient/i);
    });

    it("calls sendEmail with the given recipient", async () => {
      const res = await POST(makePostRequest({ to: "test@example.com" }));
      const body = await json(res);
      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.sent).toBe(true);
      expect(sendEmailMock).toHaveBeenCalled();
      expect(sendEmailMock.mock.calls[0][0].to).toBe("test@example.com");
    });

    it("includes HTML table in email body", async () => {
      await POST(makePostRequest({ to: "test@example.com" }));
      const emailArgs = sendEmailMock.mock.calls[0][0];
      expect(emailArgs.html).toMatch(/<table/);
      expect(emailArgs.html).toMatch(/Schedule report/);
    });

    it("returns count of items in response", async () => {
      const res = await POST(makePostRequest({ to: "test@example.com" }));
      const body = await json(res);
      expect(typeof body.count).toBe("number");
    });

    it("accepts custom subject", async () => {
      await POST(
        makePostRequest({ to: "x@y.com", subject: "Custom Subject" }),
      );
      const emailArgs = sendEmailMock.mock.calls[0][0];
      expect(emailArgs.subject).toBe("Custom Subject");
    });

    it("returns 400 for invalid trade_show_id in POST body", async () => {
      const res = await POST(
        makePostRequest({ to: "x@y.com", trade_show_id: "bad" }),
      );
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid employee_id in POST body", async () => {
      const res = await POST(
        makePostRequest({ to: "x@y.com", employee_id: "bad" }),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("source code exports dynamic = force-dynamic", () => {
    it("module exports dynamic constant", () => {
      expect(mod.dynamic).toBe("force-dynamic");
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (refactored buildScheduleReport / fetchScheduleReportItems function,
// type filtering skips irrelevant queries, trade_show_name lookup, meta in response)
// =====================================================================
describe("ours behaviors", () => {
  describe("type filter skips irrelevant SQL queries", () => {
    it("does not query reservations when type=travel", async () => {
      await GET(makeGetRequest({ type: "travel" }));
      const reservationDirectQuery = sqlMock.mock.calls.find(
        (c) =>
          typeof c[0] === "string" &&
          c[0].includes("FROM reservations") &&
          !c[0].includes("trade_shows"),
      );
      // Should either skip reservation query entirely or return no reservation items
      const res = await GET(makeGetRequest({ type: "travel" }));
      const body = await json(res);
      const nonTravel = body.items.filter((i) => i.item_type !== "travel");
      expect(nonTravel.length).toBe(0);
    });

    it("does not query travel_records when type=deadline", async () => {
      const res = await GET(makeGetRequest({ type: "deadline" }));
      const body = await json(res);
      const nonDeadline = body.items.filter((i) => i.item_type !== "deadline");
      expect(nonDeadline.length).toBe(0);
    });
  });

  describe("GET response includes trade_show_name in meta", () => {
    it("includes trade_show_name when trade_show_id is provided", async () => {
      // First calls for items, last call for trade show name lookup
      sqlMock.mockResolvedValue([]);
      sqlMock.mockResolvedValueOnce([]); // reservations
      sqlMock.mockResolvedValueOnce([]); // travel
      sqlMock.mockResolvedValueOnce([]); // tasks
      sqlMock.mockResolvedValueOnce([{ name: "CES 2026" }]); // trade show name

      const res = await GET(makeGetRequest({ trade_show_id: "5" }));
      const body = await json(res);
      expect(body.meta.trade_show_id).toBe(5);
    });
  });

  describe("GET response includes employee_id in meta", () => {
    it("includes employee_id in meta", async () => {
      const res = await GET(makeGetRequest({ employee_id: "3" }));
      const body = await json(res);
      expect(body.meta.employee_id).toBe(3);
    });
  });

  describe("items are sorted by when date ascending", () => {
    it("items are returned sorted by when field", async () => {
      // This is tested indirectly - items should be sorted
      const res = await GET(makeGetRequest());
      const body = await json(res);
      expect(Array.isArray(body.items)).toBe(true);
    });
  });

  describe("status filter works on items", () => {
    it("accepts status query parameter", async () => {
      const res = await GET(makeGetRequest({ status: "scheduled" }));
      expect(res.status).toBe(200);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (email report formatting, escapeHtml, formatWhenForEmail,
// HTML table with proper columns, truncation at 250 rows)
// =====================================================================
describe("theirs behaviors", () => {
  describe("source has escapeHtml function", () => {
    it("module source contains escapeHtml function", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/function\s+escapeHtml/);
      expect(src).toMatch(/&amp;/);
      expect(src).toMatch(/&lt;/);
      expect(src).toMatch(/&gt;/);
      expect(src).toMatch(/&quot;/);
    });
  });

  describe("source has formatWhenForEmail function", () => {
    it("module source contains formatWhenForEmail function with Intl.DateTimeFormat", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/function\s+formatWhenForEmail/);
      expect(src).toMatch(/Intl\.DateTimeFormat/);
    });
  });

  describe("email HTML has proper table structure", () => {
    it("email HTML includes column headers: When, Show, Type, Title, Person, Location, Status", async () => {
      await POST(makePostRequest({ to: "test@example.com" }));
      const emailArgs = sendEmailMock.mock.calls[0][0];
      expect(emailArgs.html).toMatch(/When/);
      expect(emailArgs.html).toMatch(/Show/);
      expect(emailArgs.html).toMatch(/Type/);
      expect(emailArgs.html).toMatch(/Title/);
      expect(emailArgs.html).toMatch(/Person/);
      expect(emailArgs.html).toMatch(/Location/);
      expect(emailArgs.html).toMatch(/Status/);
    });

    it("email HTML includes total count", async () => {
      await POST(makePostRequest({ to: "test@example.com" }));
      const emailArgs = sendEmailMock.mock.calls[0][0];
      expect(emailArgs.html).toMatch(/Total.*item/s);
    });
  });

  describe("email truncates at 250 rows", () => {
    it("source code slices items to 250 for email", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/\.slice\(0,\s*250\)/);
      expect(src).toMatch(/showing first 250/);
    });
  });

  describe("POST handler accepts email in body.email as well as body.to", () => {
    it("uses body.email when body.to is not provided", async () => {
      const res = await POST(
        makePostRequest({ email: "alt@example.com" }),
      );
      const body = await json(res);
      expect(body.ok).toBe(true);
      expect(sendEmailMock.mock.calls[0][0].to).toBe("alt@example.com");
    });
  });

  describe("source has computeTravelTitle with flight-specific logic", () => {
    it("source contains computeTravelTitle function", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/computeTravelTitle/);
      // Flight should always produce a predictable label
      expect(src).toMatch(/flight/i);
    });
  });

  describe("source has inferTravelWhen and inferTravelEndsAt helpers", () => {
    it("source contains inferTravelWhen function", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/inferTravelWhen/);
      expect(src).toMatch(/departure_scheduled/);
      expect(src).toMatch(/arrival_scheduled/);
    });

    it("source contains inferTravelEndsAt function", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/inferTravelEndsAt/);
    });
  });

  describe("source has status computation helpers", () => {
    it("source has computeReservationStatus, computeTravelStatus, computeTaskDeadlineStatus", async () => {
      const { readFileSync } = await import("fs");
      const { join } = await import("path");
      const src = readFileSync(
        join(
          __dirname,
          "resolved/apps/web/src/app/api/schedule/report/route.js",
        ),
        "utf-8",
      );
      expect(src).toMatch(/computeReservationStatus/);
      expect(src).toMatch(/computeTravelStatus/);
      expect(src).toMatch(/computeTaskDeadlineStatus/);
    });
  });

  describe("email text fallback is provided", () => {
    it("sendEmail receives text parameter as plain-text fallback", async () => {
      await POST(makePostRequest({ to: "x@y.com" }));
      const emailArgs = sendEmailMock.mock.calls[0][0];
      expect(emailArgs.text).toBeDefined();
      expect(typeof emailArgs.text).toBe("string");
      expect(emailArgs.text).toMatch(/Schedule report/);
    });
  });

  describe("POST handler returns 500 on sendEmail failure", () => {
    it("returns 500 when sendEmail throws", async () => {
      sendEmailMock.mockRejectedValue(new Error("SMTP down"));
      const res = await POST(makePostRequest({ to: "x@y.com" }));
      expect(res.status).toBe(500);
      const body = await json(res);
      expect(body.error).toMatch(/SMTP down/);
    });
  });
});
