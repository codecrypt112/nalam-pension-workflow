"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export type LoginState = { error: string | null };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "பயனர்பெயர் மற்றும் கடவுச்சொல்லை நிரப்பவும்." };
  }

  const user = await db.user.findUnique({ where: { username: parsed.data.username } });
  if (!user) {
    return { error: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது." };
  }

  const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "பயனர்பெயர் அல்லது கடவுச்சொல் தவறானது." };
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
