"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE_NAME } from "./locale";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = String(formData.get("locale") ?? "");
  const redirectTo = String(formData.get("redirectTo") || "/");

  if (locale === "ta" || locale === "en") {
    (await cookies()).set(LOCALE_COOKIE_NAME, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  redirect(redirectTo);
}
