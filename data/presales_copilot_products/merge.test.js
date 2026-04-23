import { describe, it, expect, vi, beforeEach } from "vitest";

// ── mocks ──────────────────────────────────────────────────────────────
const sqlMock = vi.fn();
sqlMock.transaction = vi.fn();

const getActorMock = vi.fn();
const requireAuthActorMock = vi.fn();

vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));
vi.mock("@/app/api/utils/authz", () => ({
  getActor: getActorMock,
  requireAuthActor: requireAuthActorMock,
}));
vi.mock("@/app/api/utils/upload", () => ({
  default: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/file.pdf" }),
}));
vi.mock("@/app/api/utils/crypto", () => ({
  decryptIfNeeded: vi.fn((v) => Promise.resolve(v)),
}));

// Mock the utility imports used by enrich/route.js
vi.mock("../../../utils/encryption.js", () => ({
  decryptFromString: vi.fn().mockResolvedValue("decrypted-key"),
}));
vi.mock("../../../utils/claude.js", () => ({
  extractSpecsWithClaude: vi.fn().mockResolvedValue({ specs: {} }),
}));
vi.mock("../../../utils/llamaparse.js", () => ({
  extractSpecsWithLlamaParse: vi.fn().mockResolvedValue({ extracted: {} }),
}));
vi.mock("../../../utils/duplicate-detection.js", () => ({
  calculateFileHash: vi.fn().mockResolvedValue("abc123hash"),
}));

// ── import resolved route handlers ──────────────────────────────────────
const productsMod = await import(
  "./resolved/apps/web/src/app/api/presales-copilot/products/route.js"
);
const productByIdMod = await import(
  "./resolved/apps/web/src/app/api/presales-copilot/products/[id]/route.js"
);
const mergeMod = await import(
  "./resolved/apps/web/src/app/api/presales-copilot/products/[id]/merge/route.js"
);

const { GET: listGET, POST: createPOST } = productsMod;
const { GET: getByIdGET, PUT: updatePUT, DELETE: deleteDELETE } = productByIdMod;
const { POST: mergePOST } = mergeMod;

// Also read source for structural tests
import { readFileSync } from "fs";
import { join } from "path";

const enrichRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/presales-copilot/products/[id]/enrich/route.js",
  ),
  "utf8",
);

const mergeRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/presales-copilot/products/[id]/merge/route.js",
  ),
  "utf8",
);

const productRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/presales-copilot/products/[id]/route.js",
  ),
  "utf8",
);

const productsListRouteSrc = readFileSync(
  join(
    __dirname,
    "resolved/apps/web/src/app/api/presales-copilot/products/route.js",
  ),
  "utf8",
);

// ── helpers ─────────────────────────────────────────────────────────────
function makeRequest(body, url = "http://localhost:3000/api/presales-copilot/products") {
  return {
    json: () => Promise.resolve(body),
    url,
    headers: new Map([["content-type", "application/json"]]),
  };
}

function makeParams(id) {
  return { params: { id: String(id) } };
}

async function json(response) {
  return response.json();
}

const adminActor = {
  userId: 1,
  isPlatformAdmin: true,
  realIsPlatformAdmin: true,
  orgIds: ["00000000-0000-0000-0000-000000000001"],
};

const regularActor = {
  userId: 2,
  isPlatformAdmin: false,
  orgIds: ["00000000-0000-0000-0000-000000000001"],
};

beforeEach(() => {
  vi.clearAllMocks();
  getActorMock.mockResolvedValue(adminActor);
  requireAuthActorMock.mockReturnValue(null); // auth passes
});

// =====================================================================
// BASE BEHAVIORS (shared by both branches)
// =====================================================================
describe("base behaviors", () => {
  describe("products/route.js - GET (list products)", () => {
    it("returns 400 when orgId is missing", async () => {
      const req = makeRequest(null, "http://localhost:3000/api/presales-copilot/products");
      const res = await listGET(req);
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/orgId/i);
    });

    it("returns 400 when orgId is not a valid UUID", async () => {
      const req = makeRequest(
        null,
        "http://localhost:3000/api/presales-copilot/products?orgId=not-a-uuid",
      );
      const res = await listGET(req);
      expect(res.status).toBe(400);
      const body = await json(res);
      expect(body.error).toMatch(/UUID/i);
    });

    it("returns 403 when actor cannot access the org", async () => {
      getActorMock.mockResolvedValue({ userId: 99, orgIds: ["other-org"] });
      const req = makeRequest(
        null,
        "http://localhost:3000/api/presales-copilot/products?orgId=00000000-0000-0000-0000-000000000001",
      );
      const res = await listGET(req);
      expect(res.status).toBe(403);
    });
  });

  describe("products/route.js - POST (create product)", () => {
    it("returns 403 when actor is not a platform admin", async () => {
      getActorMock.mockResolvedValue(regularActor);
      const res = await createPOST(
        makeRequest({ orgId: "00000000-0000-0000-0000-000000000001" }),
      );
      expect(res.status).toBe(403);
    });
  });

  describe("products/[id]/route.js - GET (single product)", () => {
    it("returns 400 for invalid product id", async () => {
      const res = await getByIdGET(makeRequest(null), makeParams("abc"));
      expect(res.status).toBe(400);
    });

    it("returns 404 when product does not exist", async () => {
      sqlMock.mockResolvedValueOnce([]); // no product
      const res = await getByIdGET(makeRequest(null), makeParams("999"));
      expect(res.status).toBe(404);
    });
  });

  describe("products/[id]/route.js - DELETE (soft delete)", () => {
    it("returns 403 when actor is not a platform admin", async () => {
      getActorMock.mockResolvedValue(regularActor);
      const res = await deleteDELETE(makeRequest(null), makeParams("1"));
      expect(res.status).toBe(403);
    });

    it("returns 404 when product does not exist", async () => {
      sqlMock.mockResolvedValueOnce([]); // no product found
      const res = await deleteDELETE(makeRequest(null), makeParams("999"));
      expect(res.status).toBe(404);
    });

    it("soft-deletes by setting is_active = false", async () => {
      sqlMock.mockResolvedValueOnce([
        { id: 1, org_id: "00000000-0000-0000-0000-000000000001" },
      ]);
      sqlMock.mockResolvedValueOnce(undefined); // update succeeds

      const res = await deleteDELETE(makeRequest(null), makeParams("1"));
      const body = await json(res);
      expect(body.ok).toBe(true);

      const updateCall = sqlMock.mock.calls.find(
        (c) => typeof c[0] === "string" && c[0].includes("is_active = false"),
      );
      expect(updateCall).toBeDefined();
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (from 'ours' branch)
// =====================================================================
describe("ours behaviors", () => {
  describe("enrich/route.js - file hash duplicate detection", () => {
    it("checks for duplicate file hashes before enrichment", () => {
      expect(enrichRouteSrc).toMatch(/checkFileHashDuplicate|file_hash/);
      expect(enrichRouteSrc).toMatch(/duplicate_file/);
    });

    it("returns 409 when duplicate file is detected", () => {
      expect(enrichRouteSrc).toMatch(/409/);
      expect(enrichRouteSrc).toMatch(/already been uploaded/i);
    });
  });

  describe("enrich/route.js - LLM configuration", () => {
    it("loads user LLM config and checks for API key", () => {
      expect(enrichRouteSrc).toMatch(/loadUserLlmConfig/);
      expect(enrichRouteSrc).toMatch(/apiKey/);
    });

    it("returns error when LLM API key is not configured", () => {
      expect(enrichRouteSrc).toMatch(/llm_not_configured/);
    });

    it("builds structured LLM config with provider, model, temperature", () => {
      expect(enrichRouteSrc).toMatch(/buildStructuredLlmConfig/);
      expect(enrichRouteSrc).toMatch(/provider/);
      expect(enrichRouteSrc).toMatch(/temperature/);
    });
  });

  describe("enrich/route.js - extraction method selection", () => {
    it("has a pickExtractionMethod function", () => {
      expect(enrichRouteSrc).toMatch(/pickExtractionMethod/);
    });

    it("supports both llamaparse and claude extraction methods", () => {
      expect(enrichRouteSrc).toMatch(/llamaparse/);
      expect(enrichRouteSrc).toMatch(/claude/);
    });
  });

  describe("enrich/route.js - merge analysis", () => {
    it("has a performMergeAnalysis function", () => {
      expect(enrichRouteSrc).toMatch(/performMergeAnalysis/);
    });

    it("detects new fields, conflicts, and enhancements", () => {
      expect(enrichRouteSrc).toMatch(/newFields/);
      expect(enrichRouteSrc).toMatch(/conflicts/);
      expect(enrichRouteSrc).toMatch(/enhancements/);
    });
  });

  describe("merge/route.js - applies merge operations", () => {
    it("has a setNestedValue function for deep object updates", () => {
      expect(mergeRouteSrc).toMatch(/setNestedValue/);
    });

    it("handles use_new, manual, and keep_existing conflict resolutions", () => {
      expect(mergeRouteSrc).toMatch(/use_new/);
      expect(mergeRouteSrc).toMatch(/manual/);
      // keep_existing is a no-op, so it might just be referenced in logic
    });

    it("applies enhancements by merging arrays", () => {
      expect(mergeRouteSrc).toMatch(/enhancement/);
      expect(mergeRouteSrc).toMatch(/merged/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (from 'theirs' branch)
// =====================================================================
describe("theirs behaviors", () => {
  describe("products/route.js - pagination support", () => {
    it("supports page and limit query parameters", () => {
      expect(productsListRouteSrc).toMatch(/page/);
      expect(productsListRouteSrc).toMatch(/limit/);
    });

    it("clamps limit to max 100", () => {
      expect(productsListRouteSrc).toMatch(/Math\.min\(100/);
    });

    it("returns pagination metadata with total, page, limit, totalPages", () => {
      expect(productsListRouteSrc).toMatch(/pagination/);
      expect(productsListRouteSrc).toMatch(/totalPages/);
    });
  });

  describe("products/route.js - sorting support", () => {
    it("supports sort and order query parameters", () => {
      expect(productsListRouteSrc).toMatch(/normalizeSort/);
      expect(productsListRouteSrc).toMatch(/normalizeOrder/);
    });

    it("defaults to updated_at sort when invalid sort field is provided", () => {
      expect(productsListRouteSrc).toMatch(/updated_at/);
    });

    it("allows only whitelisted sort columns", () => {
      expect(productsListRouteSrc).toMatch(/allowed/);
      expect(productsListRouteSrc).toMatch(/vendor.*model_name.*sku/s);
    });
  });

  describe("products/route.js - filtering support", () => {
    it("supports vendor, productType, category filters", () => {
      expect(productsListRouteSrc).toMatch(/vendor/);
      expect(productsListRouteSrc).toMatch(/productType|product_type/);
      expect(productsListRouteSrc).toMatch(/category/);
    });

    it("supports search across model_name, sku, product_family, vendor", () => {
      expect(productsListRouteSrc).toMatch(/ILIKE/);
      expect(productsListRouteSrc).toMatch(/model_name/);
    });

    it("supports includeInactive flag", () => {
      expect(productsListRouteSrc).toMatch(/includeInactive/);
    });

    it("defaults to active-only products", () => {
      expect(productsListRouteSrc).toMatch(/is_active\s*=\s*true/);
    });
  });

  describe("products/[id]/route.js - GET returns source info", () => {
    it("loads product sources from presales_copilot_product_sources table", () => {
      expect(productRouteSrc).toMatch(/presales_copilot_product_sources/);
    });

    it("returns sources array, sourceCount, and lastEnrichedAt", () => {
      expect(productRouteSrc).toMatch(/sources/);
      expect(productRouteSrc).toMatch(/sourceCount/);
      expect(productRouteSrc).toMatch(/lastEnrichedAt/);
    });
  });

  describe("products/[id]/route.js - PUT updates dynamic fields", () => {
    it("supports updating vendor, modelName, sku, productType, category", () => {
      expect(productRouteSrc).toMatch(/vendor/);
      expect(productRouteSrc).toMatch(/modelName|model_name/);
      expect(productRouteSrc).toMatch(/sku/);
    });

    it("supports updating specs as jsonb", () => {
      expect(productRouteSrc).toMatch(/specs_json.*jsonb/s);
    });

    it("sets reviewed_by when product is approved", () => {
      expect(productRouteSrc).toMatch(/reviewed_by/);
      expect(productRouteSrc).toMatch(/approved/);
    });

    it("returns 400 when no fields to update are provided", () => {
      expect(productRouteSrc).toMatch(/No fields to update/);
    });
  });

  describe("merge/route.js - records source info", () => {
    it("inserts into presales_copilot_product_sources when sourceInfo is provided", () => {
      expect(mergeRouteSrc).toMatch(/presales_copilot_product_sources/);
    });

    it("checks for duplicate file hash before inserting source", () => {
      expect(mergeRouteSrc).toMatch(/duplicate_file/);
      expect(mergeRouteSrc).toMatch(/file_hash/);
    });
  });
});
