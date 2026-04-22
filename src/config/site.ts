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
    "See your full price before you pay, then book a one-time or recurring clean in minutes.",
  /** Audience chips under the lead — segments are detailed below the fold. */
  heroAudienceChip1: "Homeowners",
  heroAudienceChip2: "Airbnb & STR hosts",
  heroAudienceChip3: "Property managers",
  heroAudienceFoot: "Across Portland & the metro",
  /** Short local line under the hero badge — concrete metro proof. */
  heroLocalLine: "Serving Portland, Beaverton, Hillsboro, Lake Oswego & nearby",
  /** Hero phone line — link wraps the number in the page. */
  heroCallLineBeforePhone: "Need help before booking? Call us at",
  heroCallLineAfterPhone:
    "— we’re happy to walk through pricing, timing, and what to expect.",
  /** Hero image pair — optional second env URL; defaults to stock photos. */
  homeHeroVisualAlt1: "Clean, bright living space after a professional visit",
  homeHeroVisualAlt2: "Kitchen and detail work — professional home cleaning",
  homeHeroVisualLabel1: "Whole-home resets",
  homeHeroVisualLabel2: "Kitchen & detail",
  homeHeroVisualCaption: "Two places we show up for every booking — add your own photos anytime.",

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
    "Reliable teams with clear communication, documented turnovers, and backup when your plans change.",
  homeWhyChoose3Title: "Easy rescheduling",
  homeWhyChoose3Body:
    "Change visits in your account, message what matters, and keep STR turnovers on the calendar.",

  /** Home — who we serve. */
  homePathsTitle: "Cleaning for every kind of home",
  homePathsLead: "Choose the service that fits your home or rental — same trusted team, tailored to you.",
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
  homeSocialProofLead: "Recent reviews — read more on Google or ask us for references.",
  homeSocialProofQuote1:
    "Transparent pricing, showed up on time, and the place smelled amazing after. Booking online took maybe five minutes.",
  homeSocialProofAttribution1: "James K. · Alberta Arts · Home cleaning",
  homeSocialProofQuote2:
    "Our NE Portland duplex turns fast — checklist photos mean fewer guest complaints. Empire’s been our go-to for turnovers.",
  homeSocialProofAttribution2: "Maria L. · Airbnb host · Portland",
  homeSocialProofSourceGoogle: "Google review",
  homeSocialProofServiceTag1: "Recurring home cleaning",
  homeSocialProofServiceTag2: "Airbnb turnover",

  /** Sticky mobile CTA label */
  homeStickyCtaLabel: "Get instant quote",

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

  /** Service area + checklist (no image placeholders — add photography later if desired). */
  homeServiceAreaTitle: "Local service, real accountability",
  homeServiceAreaLead:
    "Same simple booking in the city or suburbs — reliable teams with clear communication and documented turnovers.",
  homeServiceAreaCardTitle: "Portland metro & nearby",
  homeServiceAreaCities:
    "Portland · Beaverton · Hillsboro · Lake Oswego · Gresham · Tigard · Vancouver, WA · and nearby ZIPs",
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
    "Each visit matches what you booked — living areas, kitchen, baths, and floors per your quote.",
  homeWhatsIncludedItems: [
    "Dusting & wiping of agreed surfaces",
    "Kitchen counters, appliance fronts, and sink",
    "Bath sinks, mirrors, toilets, and showers/tubs (per scope)",
    "Vacuuming and hard-floor cleaning of booked areas",
    "Trash emptied in booked rooms",
  ] as const,
  homeVsIndependentsTitle: "Why homeowners choose Empire over independent cleaners",
  homeVsIndependentsBody:
    "Upfront pricing, insurance, and background-checked teams — plus one account to reschedule and track visits. Solo cleaners can be great; we’re built for homeowners and hosts who want predictable scheduling, documented STR work, and a team that picks up the phone when plans shift.",

  /** Home — FAQ (objections before checkout). */
  homeFaqTitle: "Common questions",
  homeFaqSubtitle: "Six quick answers — call us for anything specific to your home.",
  homeFaqFooterNote: "More detail in our Terms — or call for your situation.",
  homeStillUnsureTitle: "Still unsure?",
  homeStillUnsureLead: "Talk to us or see your price online — you only pay when you complete checkout.",
  homeFaq: [
    {
      q: "How much does it cost?",
      a: "It’s based on bedrooms, bathrooms, square footage, and service level. You’ll see the full total on the checkout screen before you pay — no surprise charges at the door.",
    },
    {
      q: "What if I’m not happy with the visit?",
      a: "We have a 24-hour satisfaction guarantee on documented areas. Contact us within 24 hours and we’ll make it right — see our Terms of Service.",
    },
    {
      q: "Are you insured?",
      a: "Yes — general liability on every job. Rare damage claims are handled per our Terms of Service.",
    },
    {
      q: "Can I reschedule?",
      a: "Yes, in My account. Changes inside 24 hours may carry a fee — see Terms of Service.",
    },
    {
      q: "What about timing, access, pets, and supplies?",
      a: "You’ll get an arrival window at booking and in your confirmation. Not home? Add lockbox or access notes. We bring pro supplies for the level you booked — note pets and any preferred products in your booking. If timing shifts, we’ll call or text.",
    },
    {
      q: "What happens right after I book?",
      a: "Email confirmation and receipt, visit in My account, and you can edit access notes anytime. Crew assignment shows when it’s set.",
    },
  ],

  footer: "Professional cleaning · Straightforward booking · Here when you need us",

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
  /** Shown on Stripe-hosted checkout as an extra reassurance line. */
  bookingStripeTrustMessage:
    "24-hour satisfaction guarantee • Fully insured • Secure Stripe checkout",
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
