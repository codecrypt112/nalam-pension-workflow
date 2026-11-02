"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const t = getDictionary(await getLocale());

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: t.login.errorMissingFields };
  }

  const user = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) {
    return { error: t.login.errorInvalidCredentials };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return { error: t.login.errorInvalidCredentials };
  }

  const token = await createSessionToken({ sub: user.id, name: user.name, role: user.role });
  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/dashboard");
}
