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

export async function GET() {
  try {
    const account = await getSignedInUser();
    if (account.error) return Response.json({ error: account.error }, { status: account.status });

    const sql = getDatabase();
    const rows = await sql`
      SELECT project, updated_at
      FROM projectpilot_projects
      WHERE user_id = ${account.userId}
      LIMIT 1
    `;

    return Response.json({ project: rows[0]?.project || null, updatedAt: rows[0]?.updated_at || null });
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
      INSERT INTO projectpilot_projects (user_id, project, updated_at)
      VALUES (${account.userId}, ${serialized}::jsonb, now())
      ON CONFLICT (user_id)
      DO UPDATE SET project = EXCLUDED.project, updated_at = now()
      RETURNING updated_at
    `;

    return Response.json({ saved: true, updatedAt: rows[0].updated_at });
  } catch (error) {
    console.error("Could not save the cloud project:", error);
    const message = process.env.DATABASE_URL
      ? "Could not save your project. Check the database connection and migration."
      : "Set DATABASE_URL to enable cloud project storage.";
    return Response.json({ error: message }, { status: 503 });
  }
}
