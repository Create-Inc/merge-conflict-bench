import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leagueId = Number(params?.id);
    if (!Number.isFinite(leagueId)) {
      return Response.json({ error: "Invalid league id" }, { status: 400 });
    }

    const [league] = await sql`
      SELECT id, league_type
      FROM leagues
      WHERE id = ${leagueId}
    `;

    if (!league) {
      return Response.json({ error: "League not found" }, { status: 404 });
    }

    if (String(league.league_type || "standard").toLowerCase() !== "chopped") {
      return Response.json(
        { error: "This league is not a chopped league." },
        { status: 400 },
      );
    }

    const history = await sql`
      SELECT
        ce.week,
        ce.eliminated_team_id,
        ce.eliminated_points,
        ce.tiebreaker,
        ce.created_at,
        t.team_name,
        t.owner_name
      FROM chopped_eliminations ce
      JOIN teams t
        ON t.id = ce.eliminated_team_id
      WHERE ce.league_id = ${leagueId}
      ORDER BY ce.week DESC
    `;

    return Response.json({ history: history || [] });
  } catch (error) {
    console.error("Error loading chopped history:", error);
    return Response.json(
      { error: "Failed to load chopped history" },
      { status: 500 },
    );
  }
}
