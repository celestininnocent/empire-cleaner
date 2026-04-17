import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: siteConfig.legalPrivacyTitle,
  description: `Privacy Policy for ${siteConfig.businessName}.`,
};

export default function PrivacyPage() {
  const tel = siteConfig.supportPhoneTel;
  const phone = siteConfig.supportPhoneDisplay;

  return (
    <SiteShell>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <h1 className="text-3xl font-semibold tracking-tight">{siteConfig.legalPrivacyTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: April 13, 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Information we collect</h2>
            <p className="text-muted-foreground">
              We collect information needed to provide, manage, and verify our cleaning services.
              This includes contact and service details (name, email, phone, and service address),
              payment data processed by Stripe (we do not store full card numbers), and optional
              notes you provide at booking.
            </p>
            <p className="text-muted-foreground">
              For service verification, we collect and store &ldquo;before and after&rdquo; photos
              of service areas. These may include metadata such as GPS location and timestamps.
            </p>
            <p className="text-muted-foreground">
              For crew members, tax and payroll information may be processed via payroll providers
              such as Gusto.
            </p>
            <p className="text-muted-foreground">
              We also collect marketing attribution and product analytics data to improve service
              coverage and customer experience, including referral source, campaign parameters
              (UTM tags), landing page path, city/state/ZIP demand trends, and booking funnel
              events (for example, checkout started and completed).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Oregon privacy rights (OCPA 2026)</h2>
            <p className="text-muted-foreground">
              In accordance with the Oregon Consumer Privacy Act, Oregon residents may request
              access and portability of collected personal data, correction of inaccuracies, and
              deletion of personal data (subject to legal or operational record-keeping
              requirements).
            </p>
            <p className="text-muted-foreground">
              We do not sell personal data. You may also opt out of targeted advertising by
              contacting us.
            </p>
            <p className="text-muted-foreground">
              We respond to verified privacy requests within 45 days.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. How we share data</h2>
            <p className="text-muted-foreground">
              We share information only with providers necessary to operations, such as dispatch
              and logistics systems used by our cleaning specialists, Stripe for payment
              processing, and payroll providers such as Gusto for crew compensation.
            </p>
            <p className="text-muted-foreground">
              We may also use data for fraud prevention, abuse prevention, and unauthorized-access
              security controls.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. Terms linkage</h2>
            <p className="text-muted-foreground">
              Service terms, cancellation policies, and liability limitations are described in our{" "}
              <Link href="/terms" className="font-medium text-primary underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Contact</h2>
            <p className="text-muted-foreground">
              For privacy requests, call or text{" "}
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
