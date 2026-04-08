import { Elysia, t } from "elysia";
import { db, sql } from "../db";
import { muscles } from "../db/schema";
import { authPlugin } from "../lib/auth";

export const muscleRoutes = new Elysia({ prefix: "/muscles" })
  .use(authPlugin)

  // GET /all — list all muscles
  .get("/all", async () => {
    const rows = await db.select().from(muscles);
    return rows;
  })

  // GET /groups — distinct major and minor groups
  .get("/groups", async () => {
    const [majorRows, minorRows] = await Promise.all([
      sql`SELECT DISTINCT major_group FROM muscles WHERE major_group IS NOT NULL ORDER BY major_group`,
      sql`SELECT DISTINCT minor_group FROM muscles WHERE minor_group IS NOT NULL ORDER BY minor_group`,
    ]);

    return {
      major_groups: majorRows.map((r) => r.major_group as string),
      minor_groups: minorRows.map((r) => r.minor_group as string),
    };
  })

  // POST / — create muscle (admin only)
  .post(
    "/",
    async ({ user, body, set }) => {
      if (!user.isAdmin) {
        set.status = 403;
        return { error: "Forbidden" };
      }

      const [muscle] = await db
        .insert(muscles)
        .values({
          name: body.name,
          scientificName: body.scientific_name,
          majorGroup: body.major_group,
          minorGroup: body.minor_group,
        })
        .returning({ id: muscles.id });

      return { id: muscle.id };
    },
    {
      body: t.Object({
        name: t.String(),
        scientific_name: t.Optional(t.String()),
        major_group: t.Optional(t.String()),
        minor_group: t.String(),
      }),
    },
  );
