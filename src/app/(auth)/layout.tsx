import { Think } from "ui/think";
import { getTranslations } from "next-intl/server";
import { AuthBackground } from "@/components/auth-background";
import { AuthTestimonials } from "@/components/auth-testimonials";

export default async function AuthLayout({
  children,
}: { children: React.ReactNode }) {
  const t = await getTranslations("Auth.Intro");
  return (
    <main className="relative w-full flex flex-col h-screen">
      <div className="flex-1">
        <div className="flex min-h-screen w-full">
          <div className="hidden lg:flex lg:w-1/2 flex-col p-4 relative">
            <div className="relative flex-1 rounded-3xl overflow-hidden bg-[#18181a] ring-1 ring-white/[0.06]">
              <div className="absolute inset-0">
                <AuthBackground />
              </div>
              <div className="relative z-10 flex flex-col h-full p-14">
                <h1 className="text-xl font-semibold flex items-center gap-3 animate-in fade-in duration-1000 text-white">
                  <Think />
                  <span>Chat Bot</span>
                </h1>
                <div className="flex-1" />
                <p className="text-white/50 text-sm mb-6 animate-in fade-in duration-1000 delay-300">
                  {t("description")}
                </p>
                <AuthTestimonials />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 p-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
