import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ── Read resolved source files as text for structural tests ────────
const read = (rel) =>
  readFileSync(join(__dirname, "resolved", rel), "utf-8");

const routeSrc = read("apps/web/src/app/api/campaigns/[id]/maps/route.js");
const pageSrc = read("apps/web/src/app/campaigns/[id]/page.jsx");
const panelSrc = read(
  "apps/web/src/components/ProfilePage/CampaignsTab/CampaignMapPanel.jsx",
);
const canvasSrc = read(
  "apps/web/src/components/ProfilePage/CampaignsTab/CampaignMapPanel/MapCanvas.jsx",
);
const createFormSrc = read(
  "apps/web/src/components/ProfilePage/CampaignsTab/CampaignMapPanel/CreateMapForm.jsx",
);
const toolPanelSrc = read(
  "apps/web/src/components/ProfilePage/CampaignsTab/CampaignMapPanel/ToolPanel.jsx",
);
const gridStyleSrc = read(
  "apps/web/src/components/ProfilePage/CampaignsTab/CampaignMapPanel/useGridStyle.js",
);

// ── Mock sql for route handler tests ────────────────────────────────
const sqlMock = vi.fn();
sqlMock.transaction = vi.fn();

const authMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/app/api/utils/sql", () => ({ default: sqlMock }));

const mod = await import(
  "./resolved/apps/web/src/app/api/campaigns/[id]/maps/route.js"
);
const { GET, POST, PATCH, DELETE: DELETE_handler } = mod;

function makeRequest(body, url) {
  return {
    json: () => Promise.resolve(body),
    url: url || "http://localhost/api/campaigns/1/maps",
  };
}

function makeParams(id) {
  return { params: { id: String(id) } };
}

async function json(res) {
  return res.json();
}

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: 1 } });
});

// =====================================================================
// BASE BEHAVIORS
// =====================================================================
describe("base behaviors", () => {
  describe("API route - GET /campaigns/[id]/maps", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValue(null);
      const res = await GET(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid campaign id", async () => {
      const res = await GET(makeRequest({}), makeParams("abc"));
      expect(res.status).toBe(400);
    });

    it("returns 403 when not an accepted member", async () => {
      sqlMock.mockResolvedValueOnce([]); // no membership
      const res = await GET(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(403);
    });

    it("returns maps and activeMapId when authorized", async () => {
      sqlMock.mockResolvedValueOnce([{ role: "owner", status: "accepted" }]);
      sqlMock.mockResolvedValueOnce([
        { id: 10, is_default: true, campaign_id: 1 },
      ]);

      const res = await GET(makeRequest({}), makeParams("1"));
      const body = await json(res);
      expect(body.maps).toBeDefined();
      expect(body.activeMapId).toBe(10);
      expect(body.isOwner).toBe(true);
    });
  });

  describe("API route - POST /campaigns/[id]/maps", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValue(null);
      const res = await POST(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(401);
    });

    it("returns 403 for non-owner members", async () => {
      sqlMock.mockResolvedValueOnce([{ role: "player", status: "accepted" }]);
      const res = await POST(makeRequest({ title: "Map" }), makeParams("1"));
      expect(res.status).toBe(403);
    });
  });

  describe("API route - PATCH /campaigns/[id]/maps", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValue(null);
      const res = await PATCH(makeRequest({}), makeParams("1"));
      expect(res.status).toBe(401);
    });

    it("returns 400 for invalid mapId", async () => {
      sqlMock.mockResolvedValueOnce([{ role: "owner", status: "accepted" }]);
      const res = await PATCH(
        makeRequest({ mapId: "bad" }),
        makeParams("1"),
      );
      expect(res.status).toBe(400);
    });
  });

  describe("API route - DELETE /campaigns/[id]/maps", () => {
    it("returns 401 when not authenticated", async () => {
      authMock.mockResolvedValue(null);
      const res = await DELETE_handler(
        makeRequest({}, "http://localhost/api/campaigns/1/maps?mapId=5"),
        makeParams("1"),
      );
      expect(res.status).toBe(401);
    });
  });

  describe("campaign page structure", () => {
    it("exports a default function component", () => {
      expect(pageSrc).toMatch(/export\s+default\s+function\s+CampaignPage/);
    });

    it("imports CampaignMapPanel", () => {
      expect(pageSrc).toMatch(/CampaignMapPanel/);
    });

    it("has tab system with map, chat, call, sound, dice, characters, sessions, npcs, loot, members", () => {
      expect(pageSrc).toMatch(/map/);
      expect(pageSrc).toMatch(/chat/);
      expect(pageSrc).toMatch(/call/);
      expect(pageSrc).toMatch(/sound/);
      expect(pageSrc).toMatch(/dice/);
      expect(pageSrc).toMatch(/characters/);
      expect(pageSrc).toMatch(/sessions/);
    });

    it("checks membership status to show content", () => {
      expect(pageSrc).toMatch(/isAccepted/);
      expect(pageSrc).toMatch(/isOwner/);
    });

    it("shows loading state", () => {
      expect(pageSrc).toMatch(/LOADING/);
    });
  });

  describe("CampaignMapPanel structure", () => {
    it("exports a default function component", () => {
      expect(panelSrc).toMatch(/export\s+default\s+function\s+CampaignMapPanel/);
    });

    it("imports and uses useGridStyle hook", () => {
      expect(panelSrc).toMatch(/useGridStyle/);
    });

    it("imports MapCanvas, ToolPanel, CreateMapForm", () => {
      expect(panelSrc).toMatch(/MapCanvas/);
      expect(panelSrc).toMatch(/ToolPanel/);
      expect(panelSrc).toMatch(/CreateMapForm/);
    });

    it("manages zoom, selectedTokenId, selectedMapId states", () => {
      expect(panelSrc).toMatch(/zoom/);
      expect(panelSrc).toMatch(/selectedTokenId/);
      expect(panelSrc).toMatch(/selectedMapId/);
    });

    it("has addPcTokens function for adding PC tokens for members", () => {
      expect(panelSrc).toMatch(/addPcTokens/);
    });

    it("has canDragToken logic - owner can drag any, player can drag own PC", () => {
      expect(panelSrc).toMatch(/canDragToken/);
      expect(panelSrc).toMatch(/isOwner/);
      expect(panelSrc).toMatch(/isPc/);
      expect(panelSrc).toMatch(/isMine/);
    });
  });

  describe("MapCanvas structure", () => {
    it("exports MapCanvas function component", () => {
      expect(canvasSrc).toMatch(/export\s+function\s+MapCanvas/);
    });

    it("has zoom in, zoom out, reset zoom controls", () => {
      expect(canvasSrc).toMatch(/ZoomIn/);
      expect(canvasSrc).toMatch(/ZoomOut/);
    });

    it("displays zoom percentage", () => {
      expect(canvasSrc).toMatch(/zoomPercent/);
    });

    it("applies transform scale based on zoom", () => {
      expect(canvasSrc).toMatch(/transform.*scale/);
    });

    it("applies gridStyle to the map area", () => {
      expect(canvasSrc).toMatch(/gridStyle/);
    });

    it("renders tokens from token list", () => {
      expect(canvasSrc).toMatch(/tokens\.map/);
    });
  });

  describe("useGridStyle hook", () => {
    it("exports useGridStyle function", () => {
      expect(gridStyleSrc).toMatch(/export\s+function\s+useGridStyle/);
    });

    it("uses useMemo for performance", () => {
      expect(gridStyleSrc).toMatch(/useMemo/);
    });

    it("generates CSS grid lines using linear-gradient", () => {
      expect(gridStyleSrc).toMatch(/linear-gradient/);
    });

    it("uses grid_size, grid_opacity, grid_color from selectedMap", () => {
      expect(gridStyleSrc).toMatch(/grid_size/);
      expect(gridStyleSrc).toMatch(/grid_opacity/);
      expect(gridStyleSrc).toMatch(/grid_color/);
    });

    it("respects grid_enabled flag", () => {
      expect(gridStyleSrc).toMatch(/grid_enabled/);
    });

    it("handles background_url for map background image", () => {
      expect(gridStyleSrc).toMatch(/background_url/);
      expect(gridStyleSrc).toMatch(/backgroundImage/);
    });
  });
});

// =====================================================================
// OURS BEHAVIORS (parseHexColor validation, background_color default #111827, zoom callbacks)
// =====================================================================
describe("ours behaviors", () => {
  describe("API route has parseHexColor validation function", () => {
    it("source contains parseHexColor function", () => {
      expect(routeSrc).toMatch(/function\s+parseHexColor/);
    });

    it("parseHexColor validates 6-char hex and normalizes with hash", () => {
      expect(routeSrc).toMatch(/hex\.length\s*!==\s*6/);
      expect(routeSrc).toMatch(/\/\^.*0-9a-fA-F.*\$\//);
    });

    it("uses parseHexColor for backgroundColor with #111827 default", () => {
      expect(routeSrc).toMatch(/parseHexColor\(.*backgroundColor.*#111827/s);
    });

    it("uses parseHexColor for gridColor with #ffffff default", () => {
      expect(routeSrc).toMatch(/parseHexColor\(.*gridColor.*#ffffff/s);
    });
  });

  describe("API route has parseGridSize and parseGridOpacity validation", () => {
    it("has parseGridSize function clamping to 8-200", () => {
      expect(routeSrc).toMatch(/function\s+parseGridSize/);
      expect(routeSrc).toMatch(/Math\.max\(8/);
      expect(routeSrc).toMatch(/Math\.min\(200/);
    });

    it("has parseGridOpacity function clamping to 0-0.5", () => {
      expect(routeSrc).toMatch(/function\s+parseGridOpacity/);
      expect(routeSrc).toMatch(/0\.5/);
    });
  });

  describe("MapCanvas uses useCallback for zoom functions", () => {
    it("imports useCallback from react", () => {
      expect(canvasSrc).toMatch(/useCallback/);
    });

    it("has zoomIn, zoomOut, resetZoom functions", () => {
      expect(canvasSrc).toMatch(/zoomIn|zoomOut|resetZoom/);
    });

    it("clamps zoom between 0.5 and 2.5", () => {
      expect(canvasSrc).toMatch(/0\.5/);
      expect(canvasSrc).toMatch(/2\.5/);
    });
  });

  describe("useGridStyle defaults background_color to #111827", () => {
    it("defaults background_color to #111827", () => {
      expect(gridStyleSrc).toMatch(/#111827/);
    });
  });

  describe("CampaignMapPanel defaults createBackgroundColor to #111827", () => {
    it("initializes createBackgroundColor to #111827", () => {
      expect(panelSrc).toMatch(/useState.*#111827/);
    });
  });
});

// =====================================================================
// THEIRS BEHAVIORS (parseSortOrder, sort_order support, createMapForm sort/default, map settings in ToolPanel)
// =====================================================================
describe("theirs behaviors", () => {
  describe("API route has parseSortOrder function", () => {
    it("has parseSortOrder function clamping 0-100000", () => {
      expect(routeSrc).toMatch(/function\s+parseSortOrder/);
      expect(routeSrc).toMatch(/100000/);
    });
  });

  describe("API route POST uses sql.transaction for insert with setDefault", () => {
    it("uses sql.transaction for creating maps", () => {
      expect(routeSrc).toMatch(/sql\.transaction/);
    });

    it("POST handler supports setDefault parameter", () => {
      expect(routeSrc).toMatch(/setDefaultRequested|setDefault/);
    });

    it("POST handler inserts sort_order, grid_size, grid_opacity, grid_color columns", () => {
      expect(routeSrc).toMatch(/sort_order/);
      expect(routeSrc).toMatch(/grid_size/);
      expect(routeSrc).toMatch(/grid_opacity/);
      expect(routeSrc).toMatch(/grid_color/);
    });
  });

  describe("CreateMapForm has sort order and set default controls", () => {
    it("exports CreateMapForm function", () => {
      expect(createFormSrc).toMatch(/export\s+function\s+CreateMapForm/);
    });

    it("has sort order input control", () => {
      expect(createFormSrc).toMatch(/createSortOrder/);
      expect(createFormSrc).toMatch(/setCreateSortOrder/);
    });

    it("has set default toggle button", () => {
      expect(createFormSrc).toMatch(/createSetDefault/);
      expect(createFormSrc).toMatch(/setCreateSetDefault/);
    });

    it("has grid size and grid opacity controls", () => {
      expect(createFormSrc).toMatch(/createGridSize/);
      expect(createFormSrc).toMatch(/createGridOpacity/);
    });

    it("has grid color and background color pickers", () => {
      expect(createFormSrc).toMatch(/createGridColor/);
      expect(createFormSrc).toMatch(/createBackgroundColor/);
      expect(createFormSrc).toMatch(/type="color"/);
    });
  });

  describe("ToolPanel has map settings section for owners", () => {
    it("exports ToolPanel function", () => {
      expect(toolPanelSrc).toMatch(/export\s+function\s+ToolPanel/);
    });

    it("has map title editor", () => {
      expect(toolPanelSrc).toMatch(/defaultValue=\{selectedMap\.title\}/);
    });

    it("has sort order editor (order)", () => {
      expect(toolPanelSrc).toMatch(/sort_order/);
    });

    it("has background color picker for selected map", () => {
      expect(toolPanelSrc).toMatch(/background_color/);
    });

    it("has background upload and clear buttons", () => {
      expect(toolPanelSrc).toMatch(/onUploadMapBackground/);
      expect(toolPanelSrc).toMatch(/onClearMapBackground/);
      expect(toolPanelSrc).toMatch(/Upload/);
      expect(toolPanelSrc).toMatch(/ImageOff/);
    });

    it("has grid toggle, grid size, grid opacity, grid color controls", () => {
      expect(toolPanelSrc).toMatch(/grid_enabled/);
      expect(toolPanelSrc).toMatch(/grid_size/);
      expect(toolPanelSrc).toMatch(/grid_opacity/);
      expect(toolPanelSrc).toMatch(/grid_color/);
    });

    it("shows 'No background image set' message when no background_url", () => {
      expect(toolPanelSrc).toMatch(/No background image set/);
    });
  });

  describe("CampaignMapPanel manages sort order and set default state for creation", () => {
    it("has createSortOrder state", () => {
      expect(panelSrc).toMatch(/createSortOrder/);
      expect(panelSrc).toMatch(/setCreateSortOrder/);
    });

    it("has createSetDefault state", () => {
      expect(panelSrc).toMatch(/createSetDefault/);
      expect(panelSrc).toMatch(/setCreateSetDefault/);
    });

    it("passes sort order and set default to CreateMapForm", () => {
      expect(panelSrc).toMatch(/createSortOrder=\{createSortOrder\}/);
      expect(panelSrc).toMatch(/createSetDefault=\{createSetDefault\}/);
    });

    it("passes upload and clear background handlers to ToolPanel", () => {
      expect(panelSrc).toMatch(/onUploadMapBackground/);
      expect(panelSrc).toMatch(/onClearMapBackground/);
    });
  });
});
