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
        </div>
        <BookingForm />
      </div>
    </SiteShell>
  );
}
