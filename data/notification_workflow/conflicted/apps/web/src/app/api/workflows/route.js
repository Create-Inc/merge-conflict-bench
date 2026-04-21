import sql from "@/app/api/utils/sql";
import { requireAllowedDomain } from "@/app/api/utils/domainRestriction";
import { getSubscriptionSummaryForUser } from "@/app/api/utils/subscription";
import { requirePermission } from "@/app/api/utils/rbac";
import { getSessionFromRequest } from "@/app/api/utils/getSessionFromRequest";
import { createNotification } from "@/app/api/utils/notify";

export async function GET(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainCheck = await requireAllowedDomain(session);
    if (!domainCheck.ok) {
      return domainCheck.response;
    }

    const allowed = await requirePermission(session, "workflows.view");
    if (!allowed.ok) {
      return allowed.response;
    }

    const userId = session.user.id;
    const workflows = await sql`
      SELECT id, name, description, status, created_at, updated_at
      FROM workflows
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return Response.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return Response.json(
      { error: "Failed to fetch workflows" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domainCheck = await requireAllowedDomain(session);
    if (!domainCheck.ok) {
      return domainCheck.response;
    }

    const allowed = await requirePermission(session, "workflows.create");
    if (!allowed.ok) {
      return allowed.response;
    }

    const userId = session.user.id;

    // Subscription gating: Free plan is limited to 5 workflows.
    const subscriptionSummary = await getSubscriptionSummaryForUser(userId);
    if (!subscriptionSummary.is_active) {
      const rows = await sql`
        SELECT COUNT(*)::int AS count
        FROM workflows
        WHERE user_id = ${userId}
      `;

      const count = rows?.[0]?.count ?? 0;
      if (count >= 5) {
        return Response.json(
          {
            error: "Free plan limit reached",
            message:
              "The Free plan allows up to 5 workflows. Upgrade in Billing to create more.",
            limit: 5,
          },
          { status: 402 },
        );
      }
    }

    const body = await request.json();
    const { name, description, nodes } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const workflowResult = await sql`
      INSERT INTO workflows (user_id, name, description, status)
      VALUES (${userId}, ${name.trim()}, ${description || null}, 'draft')
      RETURNING id, name, description, status, created_at, updated_at
    `;

    const workflow = workflowResult[0];

    if (nodes && Array.isArray(nodes) && nodes.length > 0) {
      for (const node of nodes) {
        await sql`
          INSERT INTO workflow_nodes (workflow_id, node_type, node_config, position_x, position_y)
          VALUES (
            ${workflow.id},
            ${node.node_type},
            ${JSON.stringify(node.node_config)},
            ${node.position_x || 0},
            ${node.position_y || 0}
          )
          RETURNING id
        `;
      }
    }

<<<<<<< ours
    await createNotification({
      userId,
      notificationType: "workflow_created",
      title: `Workflow created: ${workflow.name}`,
      message: "Your workflow was created as a draft.",
      metadata: { workflowId: workflow.id },
    });

=======
    // In-app notification (respects user preferences via notify.js)
    try {
      await createNotification({
        userId,
        notificationType: "workflow_created",
        title: `Workflow created: ${workflow.name}`,
        message: "Ready when you are — open it to start building.",
        metadata: {
          workflowId: workflow.id,
          url: `/workflows/${workflow.id}`,
        },
      });
    } catch (e) {
      // Non-fatal
      console.error("Failed to create workflow_created notification", e);
    }

>>>>>>> theirs
    return Response.json({ workflow }, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return Response.json(
      { error: "Failed to create workflow" },
      { status: 500 },
    );
  }
}
