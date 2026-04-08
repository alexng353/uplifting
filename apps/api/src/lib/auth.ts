import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { bearer } from "@elysiajs/bearer";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const jwtPlugin = new Elysia({ name: "jwt" })
  .use(
    jwt({
      name: "jwt",
      secret: process.env.JWT_SECRET!,
      exp: "7d",
    }),
  )
  .use(bearer());

export const authPlugin = new Elysia({ name: "auth" })
  .use(jwtPlugin)
  .derive({ as: "scoped" }, async ({ jwt, bearer, set }) => {
    if (!bearer) {
      return { userId: "" as string, user: null as any };
    }
    const payload = await jwt.verify(bearer);
    if (!payload) {
      return { userId: "" as string, user: null as any };
    }
    const userId = payload.sub as string;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      return { userId: "" as string, user: null as any };
    }
    return { userId, user };
  })
  .onBeforeHandle({ as: "scoped" }, ({ userId, set }) => {
    if (!userId) {
      set.status = 401;
      return { error: "Unauthorized" };
    }
  });
