import { neon } from "@neondatabase/serverless";
import { getAuth } from "../../../lib/auth/server";

const MAX_PROJECT_BYTES = 5 * 1024 * 1024;

async function getSignedInUser() {
  const { data, error } = await getAuth().getSession();
  if (error) {
    console.error("Could not verify the project owner session:", error);
    return { error: "Could not verify your account session.", status: 503 };
  }
  if (!data?.user?.id) return { error: "Sign in to save your project.", status: 401 };
  return { userId: data.user.id };
}

function getDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("Set DATABASE_URL to enable cloud project storage.");
  return neon(databaseUrl);
}

export async function GET(request) {
  try {
    const account = await getSignedInUser();
    if (account.error) return Response.json({ error: account.error }, { status: account.status });

    const sql = getDatabase();
    const projectId = new URL(request.url).searchParams.get("id");
    if (projectId) {
      if (projectId.length > 100) {
        return Response.json({ error: "The project ID is invalid." }, { status: 400 });
      }

      const rows = await sql`
        SELECT project, updated_at, completed_at
        FROM projectpilot_projects
        WHERE user_id = ${account.userId} AND project_id = ${projectId}
        LIMIT 1
      `;
      if (!rows[0]) return Response.json({ error: "Project not found." }, { status: 404 });
      return Response.json({
        project: rows[0].project,
        updatedAt: rows[0].updated_at,
        completedAt: rows[0].completed_at
      });
    }

    const projects = await sql`
      SELECT
        project_id AS id,
        project->>'title' AS title,
        project->>'department' AS department,
        project->>'institution' AS institution,
        updated_at AS "updatedAt",
        completed_at AS "completedAt"
      FROM projectpilot_projects
      WHERE user_id = ${account.userId}
      ORDER BY updated_at DESC
    `;

    return Response.json({ projects });
  } catch (error) {
    console.error("Could not load the cloud project:", error);
    const message = process.env.DATABASE_URL
      ? "Could not load your saved project. Check the database connection and migration."
      : "Set DATABASE_URL to enable cloud project storage.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function PUT(request) {
  try {
    const account = await getSignedInUser();
    if (account.error) return Response.json({ error: account.error }, { status: account.status });

    const contentLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_PROJECT_BYTES) {
      return Response.json({ error: "This project is too large to save (5 MB maximum)." }, { status: 413 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "The project data is not valid JSON." }, { status: 400 });
    }

    const project = body?.project;
    if (
      !project ||
      typeof project !== "object" ||
      Array.isArray(project) ||
      typeof project.id !== "string" ||
      !project.id.trim() ||
      project.id.length > 100 ||
      typeof project.title !== "string"
    ) {
      return Response.json({ error: "The project data is incomplete or invalid." }, { status: 400 });
    }

    const serialized = JSON.stringify(project);
    if (Buffer.byteLength(serialized, "utf8") > MAX_PROJECT_BYTES) {
      return Response.json({ error: "This project is too large to save (5 MB maximum)." }, { status: 413 });
    }

    const sql = getDatabase();
    const rows = await sql`
      INSERT INTO projectpilot_projects (user_id, project_id, project, updated_at)
      VALUES (${account.userId}, ${project.id}, ${serialized}::jsonb, now())
      ON CONFLICT (user_id, project_id)
      DO UPDATE SET project = EXCLUDED.project, updated_at = now()
      RETURNING updated_at, completed_at
    `;

    return Response.json({
      saved: true,
      updatedAt: rows[0].updated_at,
      completedAt: rows[0].completed_at
    });
  } catch (error) {
    console.error("Could not save the cloud project:", error);
    const message = process.env.DATABASE_URL
      ? "Could not save your project. Check the database connection and migration."
      : "Set DATABASE_URL to enable cloud project storage.";
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function PATCH(request) {
  try {
    const account = await getSignedInUser();
    if (account.error) return Response.json({ error: account.error }, { status: account.status });

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "The project update is not valid JSON." }, { status: 400 });
    }

    const { projectId, completed } = body || {};
    if (typeof projectId !== "string" || !projectId.trim() || projectId.length > 100 || typeof completed !== "boolean") {
      return Response.json({ error: "The project completion update is invalid." }, { status: 400 });
    }

    const sql = getDatabase();
    const rows = await sql`
      UPDATE projectpilot_projects
      SET completed_at = CASE
        WHEN ${completed} THEN COALESCE(completed_at, now())
        ELSE NULL
      END
      WHERE user_id = ${account.userId} AND project_id = ${projectId}
      RETURNING completed_at AS "completedAt"
    `;
    if (!rows[0]) return Response.json({ error: "Project not found." }, { status: 404 });

    return Response.json({ projectId, completedAt: rows[0].completedAt });
  } catch (error) {
    console.error("Could not update project completion:", error);
    const message = process.env.DATABASE_URL
      ? "Could not update project completion. Check the database connection and migration."
      : "Set DATABASE_URL to enable cloud project storage.";
    return Response.json({ error: message }, { status: 503 });
  }
}
