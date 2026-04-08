import { Elysia, t } from "elysia";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  emailVerificationTokens,
  passwordResetTokens,
} from "../db/schema";
import { jwtPlugin, authPlugin } from "../lib/auth";
import { hashPassword, verifyPassword } from "../lib/password";
import { sendEmail, generateVerificationCode } from "../lib/mailgun";

const publicAuthRoutes = new Elysia({ prefix: "/auth" })
  .use(jwtPlugin)

  .post(
    "/signup",
    async ({ jwt, body }) => {
      const passwordHash = await hashPassword(body.password);
      const [user] = await db
        .insert(users)
        .values({
          realName: body.real_name,
          username: body.username,
          email: body.email,
          passwordHash,
        })
        .returning();

      const token = await jwt.sign({
        sub: user.id,
        username: user.username,
        real_name: user.realName,
        email: user.email,
      });

      return token;
    },
    {
      body: t.Object({
        real_name: t.String(),
        username: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    },
  )

  .post(
    "/login",
    async ({ jwt, body, set }) => {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, body.username))
        .limit(1);

      if (!user) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        set.status = 401;
        return { error: "Invalid credentials" };
      }

      const token = await jwt.sign({
        sub: user.id,
        username: user.username,
        real_name: user.realName,
        email: user.email,
      });

      return token;
    },
    {
      body: t.Object({
        username: t.String(),
        password: t.String(),
      }),
    },
  );

const protectedAuthRoutes = new Elysia({ prefix: "/auth" })
  .use(authPlugin)

  .post("/send-verification", async ({ userId, user }) => {
    if (user.emailVerified) {
      return "Email already verified";
    }

    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.insert(emailVerificationTokens).values({
      userId,
      token: code,
      expiresAt,
    });

    await sendEmail(
      user.email,
      "Email Verification Code",
      `Your verification code is: ${code}`,
    );

    return "Verification code sent";
  })

  .post(
    "/verify-email",
    async ({ userId, body, set }) => {
      const [token] = await db
        .select()
        .from(emailVerificationTokens)
        .where(
          and(
            eq(emailVerificationTokens.userId, userId),
            eq(emailVerificationTokens.token, body.code),
            gt(emailVerificationTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!token) {
        set.status = 401;
        return { error: "Invalid or expired verification code" };
      }

      await db
        .update(users)
        .set({ emailVerified: true })
        .where(eq(users.id, userId));

      await db
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userId, userId));

      return "Email verified successfully";
    },
    {
      body: t.Object({
        code: t.String(),
      }),
    },
  )

  .post("/request-password-change", async ({ userId, user, set }) => {
    if (!user.emailVerified) {
      set.status = 401;
      return { error: "Email not verified" };
    }

    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId,
      token: code,
      expiresAt,
    });

    await sendEmail(
      user.email,
      "Password Reset Code",
      `Your password reset code is: ${code}`,
    );

    return "Verification code sent";
  })

  .post(
    "/change-password",
    async ({ userId, body, set }) => {
      const [token] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.userId, userId),
            eq(passwordResetTokens.token, body.code),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (!token) {
        set.status = 401;
        return { error: "Invalid or expired reset code" };
      }

      const newHash = await hashPassword(body.new_password);

      await db
        .update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.id, userId));

      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId));

      return "Password changed successfully";
    },
    {
      body: t.Object({
        code: t.String(),
        new_password: t.String(),
      }),
    },
  );

export const authRoutes = new Elysia()
  .use(publicAuthRoutes)
  .use(protectedAuthRoutes);
