import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { BookingForm } from "@/components/booking/booking-form";

export default function BookPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 max-w-2xl space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {siteConfig.bookHeadline}
          </h1>
          <p className="text-muted-foreground">{siteConfig.bookSub}</p>
          <p className="text-sm text-muted-foreground">
            Prefer email? Reach us at{" "}
            <a
              href={`mailto:${siteConfig.supportEmail}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {siteConfig.supportEmail}
            </a>
            .
          </p>
        </div>
        <BookingForm />
      </div>
    </SiteShell>
  );
}
