import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks ──────────────────────────────────────────────────────────────
const sqlMock = vi.fn();
const getAuthUserMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/getAuthUser", () => ({
  getAuthUser: getAuthUserMock,
}));

// We need to mock sendEmail at this path since the route imports it
const sendEmailMock = vi.fn();
vi.mock("@/app/api/utils/sendEmail", () => ({
  sendEmail: sendEmailMock,
}));

// Mock auth for the sendEmail module
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// ── import resolved modules ────────────────────────────────────────────
const { sendEmail } = await import(
  "./resolved/apps/web/src/app/api/utils/sendEmail.js"
);

// ── helpers ─────────────────────────────────────────────────────────────
function makeRequest() {
  return { json: () => Promise.resolve({}) };
}

async function json(response) {
  return response.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.AUTH_SECRET = "test-secret";
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches before divergence)
// =====================================================================
describe("base behaviors", () => {
  describe("sendEmail - fallback sender domain", () => {
    it("uses resend.dev as fallback from address", async () => {
      process.env.RESEND_API_KEY = "test-key";

      // Mock successful fetch
      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "msg-123" }),
      });

      try {
        await sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Hello",
        });

        const fetchCall = globalThis.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(body.from).toContain("resend.dev");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("sends to the Resend API endpoint", async () => {
      process.env.RESEND_API_KEY = "test-key";

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "msg-123" }),
      });

      try {
        await sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Hello",
        });

        expect(globalThis.fetch).toHaveBeenCalledWith(
          "https://api.resend.com/emails",
          expect.any(Object),
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("wraps non-array 'to' into an array", async () => {
      process.env.RESEND_API_KEY = "test-key";

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "msg-123" }),
      });

      try {
        await sendEmail({
          to: "single@email.com",
          subject: "Test",
          text: "Body",
        });

        const fetchCall = globalThis.fetch.mock.calls[0];
        const body = JSON.parse(fetchCall[1].body);
        expect(Array.isArray(body.to)).toBe(true);
        expect(body.to).toContain("single@email.com");
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it("retries with fallback domain when primary from fails", async () => {
      process.env.RESEND_API_KEY = "test-key";

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          statusText: "Forbidden",
          text: () => Promise.resolve("Domain not verified"),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: "msg-456" }),
        });

      try {
        const result = await sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Body",
          from: "Custom <noreply@custom.com>",
        });

        // Should have been called twice (primary + fallback)
        expect(globalThis.fetch).toHaveBeenCalledTimes(2);
        expect(result).toBeDefined();
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe("sendEmail - includes auth bearer token", () => {
    it("sends Authorization header with Bearer token", async () => {
      process.env.RESEND_API_KEY = "re_test_key";

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: "msg-789" }),
      });

      try {
        await sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Body",
        });

        const fetchCall = globalThis.fetch.mock.calls[0];
        expect(fetchCall[1].headers.Authorization).toBe(
          "Bearer re_test_key",
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (throw on missing API key, explicit from)
// =====================================================================
describe("ours behaviors", () => {
  describe("sendEmail - throws when RESEND_API_KEY is missing", () => {
    it("throws an Error instead of silently skipping", async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Body",
        }),
      ).rejects.toThrow();
    });

    it("the error message mentions email service not configured", async () => {
      delete process.env.RESEND_API_KEY;

      await expect(
        sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Body",
        }),
      ).rejects.toThrow(/not configured/i);
    });

    it("does NOT return a skipped: true sentinel value", async () => {
      delete process.env.RESEND_API_KEY;

      let result;
      try {
        result = await sendEmail({
          to: "user@example.com",
          subject: "Test",
          text: "Body",
        });
      } catch {
        // Expected to throw
        result = undefined;
      }

      // If somehow it didn't throw, it should NOT have skipped
      if (result !== undefined) {
        expect(result.skipped).not.toBe(true);
      }
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (structural patterns in sendEmail)
// =====================================================================
describe("theirs behaviors", () => {
  describe("sendEmail - throws on both primary and fallback failure", () => {
    it("throws when both primary and fallback from addresses fail", async () => {
      process.env.RESEND_API_KEY = "test-key";

      const originalFetch = globalThis.fetch;
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: () => Promise.resolve("error"),
      });

      try {
        await expect(
          sendEmail({
            to: "user@example.com",
            subject: "Test",
            text: "Body",
            from: "Custom <noreply@custom.com>",
          }),
        ).rejects.toThrow(/Resend email failed/i);
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
