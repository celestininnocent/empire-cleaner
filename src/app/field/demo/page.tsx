import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";
import { FieldRouteHeader } from "@/components/field/field-route-header";
import { FieldShiftDemo } from "@/components/field/field-shift-demo";

export const metadata = {
  title: `Route demo · ${siteConfig.businessName}`,
  description: "Preview today’s stops, checklist, and clock-in without saving data.",
};

export default function FieldDemoPage() {
  return (
    <SiteShell>
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-10">
        <FieldRouteHeader
          headline={siteConfig.fieldDemoHeadline}
          sub={siteConfig.fieldDemoSub}
          ctaHref="/field"
          ctaLabel="Live crew app"
        />
        <FieldShiftDemo />
      </div>
    </SiteShell>
  );
}
