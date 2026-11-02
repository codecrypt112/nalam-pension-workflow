import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionary";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/dashboard");

  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex justify-end">
          <LanguageSwitcher locale={locale} />
        </div>
        <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">{t.login.heading}</h1>
        <p className="mt-1 text-center text-sm text-slate-500">{t.login.subheading}</p>
        <div className="mt-6">
          <LoginForm t={t.login} />
        </div>
      </div>
    </main>
  );
}
