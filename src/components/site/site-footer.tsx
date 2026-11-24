import { getDictionary } from "@/i18n";
import { LogoMark } from "./logo";

export function SiteFooter({ siteName = "灵搜小店", logoUrl }: { siteName?: string; logoUrl?: string }) {
  const t = getDictionary();
  return (
    <footer className="mx-auto mt-16 w-full max-w-6xl px-6 pb-24 sm:mt-24 md:pb-10">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-foreground/[0.07] pt-8 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="size-5 rounded object-contain opacity-70" />
          ) : (
            <LogoMark className="size-5 text-foreground/70" />
          )}
          <span>© {new Date().getFullYear()} {siteName}</span>
        </div>
        <p className="text-center sm:text-right">{t.footer.desc}</p>
      </div>
    </footer>
  );
}
