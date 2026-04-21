import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { captureException } from "@/app/api/utils/sentry";
import { createNotification } from "@/app/api/utils/notify";

// Import workflow from JSON
export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { workflow_data, name, description } = await request.json();

    // Validate workflow data
    if (!workflow_data || !workflow_data.nodes) {
      return Response.json({ error: "Invalid workflow data" }, { status: 400 });
    }

    // Create new workflow
    const workflows = await sql`
      INSERT INTO workflows (
        user_id,
        name,
        description,
        status
      )
      VALUES (
        ${userId},
        ${name || workflow_data.name || "Imported Workflow"},
        ${description || workflow_data.description || "Imported from JSON"},
        'draft'
      )
      RETURNING *
    `;

    const workflow = workflows[0];
    const nodes = workflow_data.nodes || [];

    // Import nodes
    for (const node of nodes) {
      await sql`
        INSERT INTO workflow_nodes (
          workflow_id,
          node_type,
          node_config,
          position_x,
          position_y
        )
        VALUES (
          ${workflow.id},
          ${node.node_type || "action"},
          ${JSON.stringify(node.node_config || {})},
          ${node.position_x || 0},
          ${node.position_y || 0}
        )
      `;
    }

    // Create initial version
    await sql`
      INSERT INTO workflow_versions (
        workflow_id,
        version_number,
        name,
        description,
        nodes,
        status,
        created_by
      )
      VALUES (
        ${workflow.id},
        1,
        'Initial import',
        'Imported from JSON',
        ${JSON.stringify(nodes)},
        'draft',
        ${userId}
      )
    `;

<<<<<<< ours
    await createNotification({
      userId,
      notificationType: "workflow_created",
      title: `Workflow imported: ${workflow.name}`,
      message: "Your workflow was imported as a draft.",
      metadata: { workflowId: workflow.id, source: "import" },
    });

=======
    // In-app notification (respects user preferences via notify.js)
    try {
      await createNotification({
        userId,
        notificationType: "workflow_created",
        title: `Workflow imported: ${workflow.name}`,
        message: "We imported your workflow — open it to review and tweak.",
        metadata: {
          workflowId: workflow.id,
          url: `/workflows/${workflow.id}`,
        },
      });
    } catch (e) {
      console.error(
        "Failed to create workflow_created notification (import)",
        e,
      );
    }

>>>>>>> theirs
    return Response.json({
      success: true,
      message: "Workflow imported successfully",
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      nodes_imported: nodes.length,
    });
  } catch (err) {
    console.error("Import workflow error:", err);
    captureException(err, { endpoint: "/api/workflows/import" });
    return Response.json(
      { error: "Failed to import workflow", message: err.message },
      { status: 500 },
    );
  }
}
