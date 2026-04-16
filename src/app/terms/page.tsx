import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: siteConfig.legalTermsTitle,
  description: `Terms of Service for ${siteConfig.businessName}.`,
};

export default function TermsPage() {
  const tel = siteConfig.supportPhoneTel;
  const phone = siteConfig.supportPhoneDisplay;

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.legalTermsTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 13, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Services &amp; quality guarantee</h2>
            <p className="text-muted-foreground">
              {siteConfig.businessName} provides professional cleaning resets. We offer a
              24-hour satisfaction guarantee: if an area documented in your proof-of-clean report
              is unsatisfactory, notify us within 24 hours for a complimentary re-clean of that
              specific area. We do not offer cash refunds.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Pricing &amp; home condition</h2>
            <p className="text-muted-foreground">
              Your quoted price is based on the home details and service level you select at booking
              (for example bedrooms, bathrooms, square footage, and tier). If, on arrival, the
              home&apos;s condition is significantly different from what was described or reasonably
              implied — including extreme clutter, hoarding, heavy soil or neglect, bio-hazards, or
              scope far beyond the selected service — we may adjust the price before work begins, or
              pause service until a revised quote is agreed. We will communicate any adjustment
              clearly before proceeding. Paying for a booking acknowledges this policy.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. The photo protocol</h2>
            <p className="text-muted-foreground">
              Clients acknowledge that, as part of quality control and service verification,
              specialists take before-and-after photos of service areas. Photos may be used for
              internal verification, quality review, training, and proof of service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Cancellation &amp; late fees</h2>
            <p className="text-muted-foreground">
              To respect specialist schedules, cancellations made less than 24 hours before service
              may incur a $50 fee. If our team cannot access the property at the scheduled time
              (lock-out / no-access), up to 50% of the visit cost may be billed.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Limitation of liability &amp; property damage</h2>
            <p className="text-muted-foreground">
              We are not liable for pre-existing damage, improper installation, or significantly
              aged/fragile items (for example loose shelving, aged blinds, or similarly delicate
              fixtures).
            </p>
            <p className="text-muted-foreground">
              Any property damage claim must be reported with supporting photos within 24 hours of
              service completion.
            </p>
            <p className="text-muted-foreground">
              To the fullest extent permitted by Oregon law, total liability for any claim is
              limited to the amount paid for the specific service visit at issue. We maintain
              general liability insurance for major incidents.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Safety &amp; bio-hazards</h2>
            <p className="text-muted-foreground">
              Specialists are authorized to refuse or stop service if they encounter bio-hazards
              (waste or bodily fluids), extreme mold, hoarding conditions, or similar unsafe
              environments. If service is cancelled on-site for safety reasons, the full service
              fee may still apply.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Non-solicitation</h2>
            <p className="text-muted-foreground">
              Clients agree not to directly hire, solicit, or poach {siteConfig.businessName}
              specialists outside the platform for 12 months following service. A $2,500 referral
              and replacement fee applies to breaches of this clause.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Governing law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of the State of Oregon. Disputes are resolved
              in state or federal courts located in Multnomah County, Oregon.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Privacy linkage &amp; contact</h2>
            <p className="text-muted-foreground">
              Data practices and Oregon privacy rights are described in our{" "}
              <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </Link>
              . Questions about these terms: call{" "}
              <a href={`tel:${tel}`} className="font-medium text-primary underline-offset-4 hover:underline">
                {phone}
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </SiteShell>
  );
}
