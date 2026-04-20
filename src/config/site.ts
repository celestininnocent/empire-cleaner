/**
 * Copy for your live site — edit `businessName` and tune lines below.
 * Voice: first-person “we / our” (your company speaking), not “you” coaching the owner.
 */

const SUPPORT_PHONE_DISPLAY = "(503) 997-8018";
const SUPPORT_PHONE_TEL = "+15039978018";

/** Portfolio / B2B inquiries (property managers landing page mailto). */
const PARTNERSHIPS_EMAIL = "Celestininnocentt@gmail.com";

export const siteConfig = {
  businessName: "Empire Cleaner",

  titleSuffix: "Premium cleaning services",

  metaDescription:
    "Reliable Portland home cleaning — see your price upfront, book online in minutes, one-time or recurring. Insured team, satisfaction guarantee, easy rescheduling.",

  /**
   * Home hero — outcome, location, and trust for cold traffic.
   */
  heroTitle: "Reliable home cleaning in Portland.",
  heroLead:
    "Get instant pricing, book online in minutes, and choose one-time or recurring service.",
  heroTrustLine: "Professional cleaners, clear pricing, easy rescheduling.",

  /** Home — trust strip (first viewport). */
  homeTrustInsured: "Fully insured",
  homeTrustGuaranteeShort: "24-hour satisfaction guarantee",
  homeTrustLocal: "Portland-area service",
  homeTrustCheckout: "Secure checkout",

  /** Home — buyer-focused feature column. */
  homeFeatureQuoteTitle: "See your quote instantly",
  homeFeatureQuoteBody:
    "Bedrooms, baths, and square footage shape your price — you see the full total before you pay, with no surprises at checkout.",
  homeFeatureScheduleTitle: "Pick one-time or recurring cleaning",
  homeFeatureScheduleBody:
    "Book a single reset or set up weekly, bi-weekly, or monthly visits — whatever fits your home.",
  homeFeatureManageTitle: "Manage bookings without calling",
  homeFeatureManageBody:
    "After you book, sign in anytime to reschedule, see who we’re sending, and track your visits in one place.",

  /** Home — who we serve. */
  homePathsTitle: "Cleaning for every kind of home",
  homePathsLead: "Choose the path that matches how you use your space — same trusted team, tailored to your situation.",
  homePathHomeTitle: "Homeowners",
  homePathHomeBody:
    "Residential cleaning with upfront pricing and an account you control — ideal for busy households in Portland and nearby.",
  homePathHomeCta: "Book a home clean",
  homePathHostsTitle: "Short-term rentals & Airbnb",
  homePathHostsBody:
    "Turnover-ready cleaning with photo documentation and scheduling built around check-in and check-out.",
  homePathHostsCta: "Cleaning for hosts",
  homePathPmTitle: "Property managers",
  homePathPmBody:
    "Portfolio-scale turnover cleaning — one point of contact and clear communication across units.",
  homePathPmCta: "Portfolio & B2B",

  /** Home — social proof (edit quotes as you collect real testimonials). */
  homeSocialProofTitle: "Trusted by Portland-area homeowners & hosts",
  homeSocialProofLead:
    "Real homes, rentals, and portfolios — the same upfront pricing and professional team, whether it’s a one-time reset or recurring service.",
  homeSocialProofQuote1:
    "I saw the full price before I paid. Booking took a few minutes and rescheduling in the portal was easy.",
  homeSocialProofAttribution1: "Residential customer · Portland metro",
  homeSocialProofQuote2:
    "We needed turnovers that don’t slip — clear communication and photo checklists help us stay on schedule for guests.",
  homeSocialProofAttribution2: "Short-term rental host · Portland area",

  /** Home — how it works. */
  homeProcessTitle: "How booking works",
  homeProcessLead: "Three simple steps from quote to a spot on the calendar.",
  homeProcess1Title: "Get your quote",
  homeProcess1Body: "Tell us about your home and service level — your price appears before checkout.",
  homeProcess2Title: "Choose your time",
  homeProcess2Body: "Pick a visit that fits your schedule. Pay securely online to confirm.",
  homeProcess3Title: "We clean",
  homeProcess3Body:
    "Our team arrives prepared with your notes. Manage or reschedule anytime from your account.",

  /** Home — FAQ (objections before checkout). */
  homeFaqTitle: "Common questions",
  homeFaqSubtitle:
    "Straight answers on price, insurance, satisfaction, and scheduling — before you check out.",
  homeFaq: [
    {
      q: "How much does it cost?",
      a: "Your total depends on how many bedrooms and bathrooms you have, approximate square footage, and the service level you choose (for example standard vs. deeper reset). You’ll see the full dollar amount on the checkout screen before you pay — no hidden fees or surprise charges at the door.",
    },
    {
      q: "What if I’m not happy with the visit?",
      a: "We offer a 24-hour satisfaction guarantee on documented service areas. Reach out within 24 hours of your visit and we’ll make it right per our policy. Full details are in our Terms of Service.",
    },
    {
      q: "Are you insured?",
      a: "Yes. We carry general liability insurance for peace of mind on every job. That protects you in the rare case of accidental damage during service, in line with our Terms of Service.",
    },
    {
      q: "Do I need to be home?",
      a: "Many customers provide access instructions at booking (lockbox, code, or concierge). Choose what works for you; we’ll follow the notes you leave.",
    },
    {
      q: "Can I reschedule?",
      a: "Yes. Sign in to My account to view upcoming visits and request changes. Cancellations with less than 24 hours’ notice may incur a fee — see our Terms of Service for cancellation and access policies.",
    },
  ],

  footer: "Professional cleaning · Straightforward booking · Here when you need us",
  /** Footer — internal tools (not shown in main header). */
  footerTeamToolsLead: "Team & tools",

  /** Display and `tel:` href — support line for crew access, booking, and general help. */
  supportPhoneDisplay: SUPPORT_PHONE_DISPLAY,
  supportPhoneTel: SUPPORT_PHONE_TEL,

  /** Growth & portfolio quote requests — `mailto:` on /property-managers. */
  partnershipsEmail: PARTNERSHIPS_EMAIL,

  legalTermsTitle: "Terms of Service",
  legalPrivacyTitle: "Privacy Policy",
  legalTermsLink: "Terms of Service",
  legalPrivacyLink: "Privacy Policy",

  /** Booking form — sentence after checkbox (links added in the form). */
  bookingAgreeLead: "I agree to the",
  bookingAgreeMid: "and",
  bookingAgreeTail:
    "I understand services are subject to scheduling, crew availability, and our policies.",

  nav: {
    book: "Book",
    portal: "My account",
    hosts: "Hosts & STR",
    propertyManagers: "Property managers",
    admin: "Owner",
    field: "Crew app",
  },

  stripeProductLine: "Recurring home clean",

  cleanerBioFallback: "One of our professional cleaners.",

  tipNote:
    "Tips are saved here. We will connect Stripe when we are ready to charge cards.",

  servicePromise: "How we show up for every home",

  fieldSubtitle: "Today's stops · checklist · clock-in · pay estimate",
  fieldHeadline: "Today's route",
  fieldTryDemoLabel: "Try sample route",
  /** Shown in the route strip when there are no stops today — keep short; matches “no route” card below. */
  fieldRouteStripLabel: "Route",
  fieldRouteOrderLabel: "Stop order",
  fieldRouteByAppointment: "By time",
  fieldRouteByDrive: "Shorter drive",
  /** Shown under the toggle — straight-line miles from crew base (approximate). */
  fieldRouteMilesApprox: (miles: string) => `~${miles} mi straight-line from base`,
  fieldRouteDriveOrderWarning:
    "This order saves miles but may not match appointment times — confirm with dispatch if unsure.",
  fieldRouteOrderHint: "Uses your crew’s base location and job map pins (straight-line, not traffic).",
  fieldRouteStripEmpty: "No route found for today.",
  fieldNoRouteCardTitle: "No route found",
  fieldNoRouteCardBody: `Nothing is scheduled for your crew right now. When jobs are booked and assigned, stops and times will show in the strip above. Questions? ${SUPPORT_PHONE_DISPLAY}.`,
  /** Shown when you’re signed in but we haven’t attached a crew row yet — same layout as the live route, not a separate error screen. */
  fieldPendingCrewBanner:
    "We’re linking this login to your crew automatically (ZIP + hiring record). If you were just granted access, refresh once or sign out and back in.",
  fieldPendingCrewRefresh: "Refresh",
  fieldRouteStripPending: "No crew route yet.",
  fieldPendingCrewCardTitle: "No crew route yet",
  fieldPendingCrewCardBody: `When your account is connected to a crew, today’s stops will show above. Dispatch may also have nothing scheduled yet — in that case you’ll still see the route shell with no stops. If crew assignment looks wrong or stays empty, call ${SUPPORT_PHONE_DISPLAY}.`,
  fieldMessagingTitle: "Crew messages",
  fieldMessagingNoTeamPlaceholder:
    "Available once your login is linked to a crew. You’ll share one thread with everyone on that route.",
  fieldMessagingSub:
    "Quick notes to dispatch and your team. This thread is your crew’s route — same team as in Hiring and the jobs assigned to that ZIP/area.",
  fieldMessagingPlaceholder: "Running late, need supplies, question about a stop…",
  fieldMessagingSend: "Send",
  fieldDemoHeadline: "Route demo (sample stops)",
  fieldDemoSub:
    "Tap between two fake visits, check off rooms, upload demo photos, and try clock-in. Nothing writes to the database.",

  /**
   * Crew onboarding — one slide for trainers (paste into deck or handbook).
   */
  crewOnboardingScopeSlideTitle: "When the job doesn’t match the booking",
  crewOnboardingScopeSlideBody:
    "If the home’s condition is much worse than what was booked (clutter, heavy soil, wrong scope, or safety issues), take photos, message dispatch immediately, and do not start a full clean until dispatch approves a revised scope or price.",

  /** Crew app — under the active stop card; links to Terms in UI. */
  fieldScopeMismatchBannerLead:
    "Home worse than described? Don’t start full service — contact dispatch with photos. Price may be adjusted per our ",

  portalHeadline: "Your visits",
  portalSub:
    "Reschedule, see who we are sending, tip the team, and confirm when the visit is done.",
  portalSubscribedHint:
    "You’re on a recurring plan — your next cleaning is highlighted below.",

  /** Dashboard hero — line before the bold time */
  portalNextCleaningLabel: "Next cleaning",
  portalNextVisitLabel: "Next visit",
  portalSubscriptionBadge: "Recurring subscription",
  portalPlanLabel: "Plan",
  portalSubscriptionActiveNoDate:
    "Your subscription is active. Upcoming visits will appear below as soon as they’re scheduled.",
  portalCrewHeading: "Who we are sending",
  portalRateTitle: "Confirm & rate this visit",
  portalRateSubtitle:
    "When the work is done, confirm below and rate your experience (1–5 stars). You can add a short note.",
  portalRateWait:
    "You’ll be able to confirm and rate after your scheduled visit time, or once our crew marks the job complete in their app.",
  portalRateStarsLabel: "Your rating",
  portalRateNoteLabel: "Optional feedback",
  portalRateNotePlaceholder: "Anything we should know?",
  portalRateSubmit: "Confirm visit complete & save rating",
  portalRateSaved: "Thanks — your confirmation and rating are saved.",
  portalRateConfirmHint:
    "By confirming, you agree the scheduled cleaning visit was completed to your satisfaction.",

  adminHeadline: "Owner dashboard",
  adminSub:
    "Our jobs on the map, where our people are, and what gets assigned next.",
  adminCrewMessagesTitle: "Crew messages",
  adminCrewMessagesSub:
    "Latest notes from field staff (same thread they see on the crew app).",

  hiringHeadline: "Hiring",
  hiringSub:
    "We track applicants from first contact through offer, onboarding, and hired. Revoke app access anytime without deleting their login.",
  hiringAddTitle: "Log a new applicant",
  hiringAddDesc:
    "Walk-ins, referrals, job posts — add anyone who applied to join our company.",
  hiringBoardTitle: "Pipeline",
  hiringBoardDesc:
    "Move stages as you interview (Offered → Onboarded → Hired). Grant crew or owner access when appropriate, or revoke access to remove /field and /admin without deleting the account.",

  adminHiringCta: "Hire team",

  /** Legacy — /field no longer uses a full-page blocking state; kept for reference or rare reuse. */
  fieldAwaitingTitle: "Crew route isn’t loading yet",
  fieldSetupRequiredBody:
    "Try refreshing this page or signing out and back in. If it keeps happening, ask an owner to open Hiring, find your name, and tap Grant crew app access again — that reconnects this login to your crew. Make sure the email on your hiring row matches the email you use to sign in.",
  /** Owners shouldn’t be forced into a cleaner row — point them to /admin. */
  fieldOwnerInsteadTitle: "Crew app is for field staff",
  fieldOwnerInsteadBody:
    "Your account is an owner. Use the owner dashboard for dispatch, map, and hiring — not this screen.",

  bookHeadline: "Book a clean",
  bookSub:
    "Transparent pricing for your size and service level. Pay securely with Stripe first; we set up your account from your receipt so you can manage visits anytime.",
  /** Shown near the price / hero */
  bookSpeedLine: "Most people finish checkout in under a minute.",
  bookTrustGuarantee: "24-hour satisfaction guarantee — let us know within a day and we’ll make it right.",
  bookTrustPhotos: "Proof-of-clean photos on visits for quality you can see.",
  bookTrustInsurance:
    "Fully insured — general liability coverage for peace of mind on every job.",
  bookingPriceHint:
    "One clear total for your home size and service level before you pay.",
  bookingContactTitle: "Confirmation & receipts",
  bookingContactDesc:
    "We’ll send your receipt here. No password required before checkout — you can sign in after payment using this email.",
  bookingAddonsSummary: "Optional add-ons",
  bookingAddonsHint: "Skip unless you need something extra — keeps checkout simple.",
  bookingNotesSummary: "Special instructions (optional)",
  bookingCtaOnce: "Book now — secure checkout",
  bookingCtaRecurring: "Start your plan — secure checkout",

  bookingNotesTitle: "Notes & special instructions",
  bookingNotesDescription:
    "Optional — gate codes, pets, parking, allergies, or rooms to prioritize. Stored with your booking for your crew (max 500 characters).",
  bookingPricingAdjustmentNote:
    "Quoted prices assume the home matches the details you chose. If the condition is significantly different than described, we may adjust the price before work begins — see our ",
  bookingPricingAdjustmentTermsLink: "Terms of Service",

  portalJobNotesHeading: "Your notes for this visit",
  fieldJobNotesHeading: "Customer notes",
  adminJobNotesHeading: "Customer notes",

  loginTitle: "Welcome back",
  loginSub: "Sign in to your account — same login for customers, crew, and team.",
  signupPhoneLabel: "Mobile phone",
  signupPhoneHint:
    "Saved to your account automatically — we use it for text alerts about jobs and routes if you’re on a crew (time + address). Standard message rates may apply.",
  signupSmsConsent:
    "By providing a mobile number, you agree we may send automated service messages about bookings or crew work to that number.",

  adminRestrictedTitle: "Owners only",
  adminRestrictedBody:
    "Dispatch and hiring are for our owner and trusted admins. In Supabase, set profile role to admin for accounts that should have access.",
} as const;

export type SiteConfig = typeof siteConfig;
