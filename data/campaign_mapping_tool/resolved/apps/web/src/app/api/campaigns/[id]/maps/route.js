import { auth } from "@/auth";
import sql from "@/app/api/utils/sql";

async function getMembership(campaignId, userId) {
  const rows = await sql`
    SELECT role, status
    FROM campaign_members
    WHERE group_id = ${campaignId} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] || null;
}

async function requireOwner(campaignId, userId) {
  const m = await getMembership(campaignId, userId);
  if (!m || m.status !== "accepted") {
    return { ok: false, error: "Forbidden" };
  }
  if (m.role !== "owner") {
    return { ok: false, error: "Only the DM can do that" };
  }
  return { ok: true };
}

function parseGridSize(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 32;
  return Math.max(8, Math.min(200, Math.floor(n)));
}

function parseGridOpacity(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0.06;
  return Math.max(0, Math.min(0.5, n));
}

function parseSortOrder(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100000, Math.floor(n)));
}

function parseHexColor(v, fallback) {
  const raw = String(v || "").trim();
  if (!raw) return fallback;
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  const hex = withHash.slice(1);
  if (hex.length !== 6) return fallback;
  const ok = /^[0-9a-fA-F]{6}$/.test(hex);
  return ok ? withHash.toLowerCase() : fallback;
}

export async function GET(request, { params: { id } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaignId = Number(id);
    if (!Number.isFinite(campaignId)) {
      return Response.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    const membership = await getMembership(campaignId, session.user.id);
    if (!membership || membership.status !== "accepted") {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const maps = await sql`
      SELECT id, campaign_id, title, background_url, background_color, grid_enabled,
             is_default, sort_order, grid_size, grid_opacity, grid_color,
             created_by, created_at, updated_at
      FROM campaign_maps
      WHERE campaign_id = ${campaignId}
      ORDER BY is_default DESC, sort_order ASC, created_at ASC
      LIMIT 100
    `;

    const activeMap = maps.find((m) => m.is_default) || maps[0] || null;

    return Response.json({
      maps,
      activeMapId: activeMap?.id || null,
      isOwner: membership.role === "owner",
    });
  } catch (error) {
    console.error("GET /api/campaigns/[id]/maps error", error);
    return Response.json({ error: "Failed to load maps" }, { status: 500 });
  }
}

export async function POST(request, { params: { id } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaignId = Number(id);
    if (!Number.isFinite(campaignId)) {
      return Response.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    const gate = await requireOwner(campaignId, session.user.id);
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: 403 });
    }

    const body = await request.json();
    const title = String(body?.title || "New Map").trim() || "New Map";
    const backgroundUrl = body?.backgroundUrl
      ? String(body.backgroundUrl).trim()
      : null;
    const backgroundColor = parseHexColor(body?.backgroundColor, "#111827");

    const gridEnabled = body?.gridEnabled === false ? false : true;
    const gridSize = parseGridSize(body?.gridSize);
    const gridOpacity = parseGridOpacity(body?.gridOpacity);
    const gridColor = parseHexColor(body?.gridColor, "#ffffff");

    const sortOrder = parseSortOrder(body?.sortOrder);
    const setDefaultRequested = body?.setDefault === true;

    const existing = await sql`
      SELECT id
      FROM campaign_maps
      WHERE campaign_id = ${campaignId}
      ORDER BY created_at ASC
      LIMIT 1
    `;

    const shouldDefault = !existing[0]?.id || setDefaultRequested;

    const created = await sql.transaction((txn) => {
      const queries = [];

      if (setDefaultRequested) {
        queries.push(txn`
          UPDATE campaign_maps
          SET is_default = false
          WHERE campaign_id = ${campaignId} AND is_default = true
        `);
      }

      queries.push(txn`
        INSERT INTO campaign_maps (
          campaign_id,
          title,
          background_url,
          background_color,
          grid_enabled,
          is_default,
          sort_order,
          grid_size,
          grid_opacity,
          grid_color,
          created_by
        )
        VALUES (
          ${campaignId},
          ${title},
          ${backgroundUrl},
          ${backgroundColor},
          ${gridEnabled},
          ${shouldDefault},
          ${sortOrder},
          ${gridSize},
          ${gridOpacity},
          ${gridColor},
          ${session.user.id}
        )
        RETURNING id, campaign_id, title, background_url, background_color, grid_enabled,
                  is_default, sort_order, grid_size, grid_opacity, grid_color,
                  created_by, created_at, updated_at
      `);

      return queries;
    });

    const insertedRows = Array.isArray(created)
      ? created[created.length - 1]
      : [];

    return Response.json({ map: insertedRows[0] || null });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/maps error", error);
    return Response.json({ error: "Failed to create map" }, { status: 500 });
  }
}

export async function PATCH(request, { params: { id } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaignId = Number(id);
    if (!Number.isFinite(campaignId)) {
      return Response.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    const gate = await requireOwner(campaignId, session.user.id);
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: 403 });
    }

    const body = await request.json();
    const mapId = Number(body?.mapId);
    if (!Number.isFinite(mapId)) {
      return Response.json({ error: "Invalid map" }, { status: 400 });
    }

    const found = await sql`
      SELECT id
      FROM campaign_maps
      WHERE id = ${mapId} AND campaign_id = ${campaignId}
      LIMIT 1
    `;

    if (!found[0]) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const setDefault = body?.setDefault === true;

    const setClauses = [];
    const values = [];
    let idx = 1;

    const add = (col, val, cast) => {
      const castSql = cast ? `::${cast}` : "";
      setClauses.push(`${col} = $${idx}${castSql}`);
      values.push(val);
      idx++;
    };

    if (body?.title !== undefined) {
      add("title", body.title ? String(body.title).trim() : "");
    }

    if (body?.backgroundUrl !== undefined) {
      add(
        "background_url",
        body.backgroundUrl ? String(body.backgroundUrl).trim() : null,
      );
    }

    if (body?.backgroundColor !== undefined) {
      add(
        "background_color",
        parseHexColor(body.backgroundColor, "#111827"),
      );
    }

    if (body?.gridEnabled !== undefined) {
      add("grid_enabled", body.gridEnabled === false ? false : true);
    }

    if (body?.gridSize !== undefined) {
      add("grid_size", parseGridSize(body.gridSize));
    }

    if (body?.gridOpacity !== undefined) {
      add("grid_opacity", parseGridOpacity(body.gridOpacity));
    }

    if (body?.gridColor !== undefined) {
      add("grid_color", parseHexColor(body.gridColor, "#ffffff"));
    }

    if (body?.sortOrder !== undefined) {
      add("sort_order", parseSortOrder(body.sortOrder));
    }

    if (setClauses.length === 0 && !setDefault) {
      return Response.json({ error: "Nothing to update" }, { status: 400 });
    }

    const result = await sql.transaction((txn) => {
      const queries = [];

      if (setDefault) {
        queries.push(txn`
          UPDATE campaign_maps
          SET is_default = false
          WHERE campaign_id = ${campaignId} AND is_default = true
        `);
        setClauses.push("is_default = true");
      }

      if (setClauses.length > 0) {
        setClauses.push("updated_at = CURRENT_TIMESTAMP");

        values.push(mapId);
        const query = `
          UPDATE campaign_maps
          SET ${setClauses.join(", ")}
          WHERE id = $${idx}
          RETURNING id, campaign_id, title, background_url, background_color, grid_enabled,
                    is_default, sort_order, grid_size, grid_opacity, grid_color,
                    created_by, created_at, updated_at
        `;

        queries.push(txn(query, values));
      }

      return queries;
    });

    const updated = Array.isArray(result) ? result[result.length - 1] : [];

    return Response.json({ map: updated?.[0] || null });
  } catch (error) {
    console.error("PATCH /api/campaigns/[id]/maps error", error);
    return Response.json({ error: "Failed to update map" }, { status: 500 });
  }
}

export async function DELETE(request, { params: { id } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const campaignId = Number(id);
    if (!Number.isFinite(campaignId)) {
      return Response.json({ error: "Invalid campaign id" }, { status: 400 });
    }

    const gate = await requireOwner(campaignId, session.user.id);
    if (!gate.ok) {
      return Response.json({ error: gate.error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const mapId = Number(searchParams.get("mapId"));
    if (!Number.isFinite(mapId)) {
      return Response.json({ error: "Invalid map" }, { status: 400 });
    }

    const maps = await sql`
      SELECT id, is_default
      FROM campaign_maps
      WHERE campaign_id = ${campaignId}
      ORDER BY is_default DESC, sort_order ASC, created_at ASC
    `;

    const target = maps.find((m) => Number(m.id) === mapId);
    if (!target) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await sql.transaction((txn) => {
      const queries = [];

      queries.push(txn`
        DELETE FROM campaign_maps
        WHERE id = ${mapId} AND campaign_id = ${campaignId}
      `);

      if (target.is_default) {
        const next = maps.find((m) => Number(m.id) !== mapId);
        if (next) {
          queries.push(txn`
            UPDATE campaign_maps
            SET is_default = true
            WHERE id = ${next.id}
          `);
        }
      }

      return queries;
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id]/maps error", error);
    return Response.json({ error: "Failed to delete map" }, { status: 500 });
  }
}
