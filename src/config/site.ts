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
    "Reliable Portland home cleaning with instant online booking. Upfront pricing, insured background-checked cleaners, satisfaction guarantee, STR turnovers & recurring home cleans.",

  /**
   * Home hero — outcome-led headline + emotional hook (edit stats & testimonial with real numbers).
   */
  heroTitle: "Reliable Portland home cleaning with instant online booking",
  heroLead:
    "See your full price before you pay, then lock in a visit in minutes — one-time or recurring.",
  heroEmotionalLine:
    "Get your evenings back at home — or stress-free turnovers that don’t bump guest check-in.",
  /** Featured in hero — replace with a real Google review when you have permission. */
  heroTestimonialQuote:
    "On time, spotless kitchen and baths, and the price matched the quote exactly. Wish we’d switched sooner.",
  heroTestimonialName: "Sarah M.",
  heroTestimonialDetail: "Laurelhurst · Recurring home cleaning",
  heroTestimonialSource: "Google review",

  /** Hero stats — update with real metrics (or remove a line until you have data). */
  homeTrustStatGoogleValue: "4.9",
  homeTrustStatGoogleLabel: "Google rating",
  homeTrustStatGoogleSub: "127 reviews",
  homeTrustStatCleansValue: "1,200+",
  homeTrustStatCleansLabel: "Cleans completed",
  homeTrustStatRecurringValue: "85+",
  homeTrustStatRecurringLabel: "Recurring homes",

  /** Home — trust strip (specific reassurance). */
  homeTrustInsured: "Insured",
  homeTrustBackgroundChecked: "Background-checked cleaners",
  homeTrustGuaranteeShort: "Satisfaction guarantee",
  homeTrustCheckout: "Secure payment",

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

  /** Between hero and segments — fast-scan value stack. */
  homeWhyChooseTitle: "Why homeowners & hosts choose us",
  homeWhyChooseLead: "Instant quote, reliable cleaners, easy rescheduling — without the back-and-forth of hiring solo cleaners.",
  homeWhyChoose1Title: "Instant quote",
  homeWhyChoose1Body:
    "Know your total before checkout — sized to your rooms, baths, and service level.",
  homeWhyChoose2Title: "Reliable cleaners",
  homeWhyChoose2Body:
    "Insured, background-checked teams with notes, access details, and dispatch support behind every job.",
  homeWhyChoose3Title: "Easy rescheduling",
  homeWhyChoose3Body:
    "Change visits in your account, message what matters, and keep STR turnovers on the calendar.",

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

  /** Home — social proof section (names & neighborhoods — update with real reviews). */
  homeSocialProofTitle: "Loved by Portland neighbors & rental hosts",
  homeSocialProofLead:
    "A few recent reviews — ask us for more references or read us on Google anytime.",
  homeSocialProofQuote1:
    "Transparent pricing, showed up on time, and the place smelled amazing after. Booking online took maybe five minutes.",
  homeSocialProofAttribution1: "James K. · Alberta Arts · Home cleaning",
  homeSocialProofQuote2:
    "Our NE Portland duplex turns fast — checklist photos mean fewer guest complaints. Empire’s been our go-to for turnovers.",
  homeSocialProofAttribution2: "Maria L. · Airbnb host · Portland",
  homeSocialProofSourceGoogle: "Google review",

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

  /** Visual proof — add real photos to /public/marketing/ when ready (see homepage). */
  homeVisualProofTitle: "See the quality we deliver",
  homeVisualProofLead:
    "Photo checklists for hosts, documented visits for homes — add your own before/after shots to this section anytime.",
  homeVisualProofBeforeCaption: "Before — add your photo",
  homeVisualProofAfterCaption: "After — add your photo",
  homeVisualProofChecklistTitle: "Host turnover checklist (sample)",
  homeVisualProofChecklistSub: "Rooms, photos, and timestamps — the same structure our crew uses in the field.",
  homeChecklistSampleItems: [
    "Kitchen & dining reset",
    "Baths & glass",
    "Floors vacuumed",
    "Trash removed",
    "Checklist photos",
  ] as const,

  /** What’s included vs hiring independent cleaners. */
  homeWhatsIncludedTitle: "What’s included in your clean",
  homeWhatsIncludedIntro:
    "Every visit is scoped to your booking — typical residential service covers living areas, kitchen, baths, and floors you select at quote time.",
  homeWhatsIncludedItems: [
    "Dusting & wiping of agreed surfaces",
    "Kitchen counters, appliance fronts, and sink",
    "Bath sinks, mirrors, toilets, and showers/tubs (per scope)",
    "Vacuuming and hard-floor cleaning of booked areas",
    "Trash emptied in booked rooms",
  ] as const,
  homeVsIndependentsTitle: "Why book through us instead of a solo cleaner?",
  homeVsIndependentsBody:
    "You get upfront pricing, insurance, background-checked teams, dispatch support, and an account to reschedule — without chasing texts or negotiating cash rates. Independent cleaners can be great; we built Empire Cleaner for people who want predictability and backup when plans change.",

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
    {
      q: "What time will you arrive?",
      a: "We schedule visits within an arrival window (shown at booking and in your confirmation). You’ll get the planned window before we arrive; if dispatch needs to adjust, we’ll reach out by phone or text.",
    },
    {
      q: "Do you bring supplies and equipment?",
      a: "Our teams arrive with professional-grade supplies and equipment for the service level you booked. If you prefer specific products for sensitive surfaces, leave them out with a note in your booking.",
    },
    {
      q: "What about pets?",
      a: "Tell us about pets in your booking notes (allergies, crating, or shy animals). We work around your household — if a pet makes a room unsafe to enter, we’ll document and coordinate with you.",
    },
    {
      q: "What happens right after I book?",
      a: "You’ll receive a confirmation and receipt by email, your visit appears in My account, and you can add or edit access notes anytime before the appointment. Closer to the date, you’ll see crew assignment when it’s set.",
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
