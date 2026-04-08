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
  .derive(async ({ jwt, bearer, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error("Unauthorized");
    }
    const payload = await jwt.verify(bearer);
    if (!payload) {
      set.status = 401;
      throw new Error("JWT has expired. Please log in again.");
    }
    const userId = payload.sub as string;
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) {
      set.status = 401;
      throw new Error("User not found");
    }
    return { userId, user };
  });
