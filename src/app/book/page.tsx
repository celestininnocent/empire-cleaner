import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { BookingForm } from "@/components/booking/booking-form";

export default function BookPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 max-w-2xl border-b border-border/60 pb-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Book online</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {siteConfig.bookHeadline}
          </h1>
          <p className="mt-3 text-pretty text-muted-foreground leading-relaxed">{siteConfig.bookSub}</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Prefer email? Reach us at{" "}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </header>
        <div className="rounded-2xl border border-border/70 bg-card/40 p-4 shadow-sm sm:p-6 md:p-8">
          <BookingForm />
        </div>
      </div>
    </SiteShell>
  );
}
