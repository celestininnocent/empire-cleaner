/** Static IDs so the demo checklist stays stable across renders. */
export const DEMO_JOB_IDS = {
  morning: "a0000000-0000-4000-8000-000000000001",
  afternoon: "a0000000-0000-4000-8000-000000000002",
} as const;

export type DemoJobRow = {
  id: string;
  scheduled_start: string;
  address_line: string;
  city: string | null;
  state: string | null;
  zip: string;
  status: string;
  price_cents: number;
  lat: number | null;
  lng: number | null;
  property_type?: string | null;
  service_tier?: string | null;
  customer_notes?: string | null;
};

export type DemoCheckRow = {
  id: string;
  job_id: string;
  room_key: string;
  label: string;
  requires_photo: boolean;
  completed_at: string | null;
  photo_url: string | null;
};

export function buildDemoJobsForToday(): DemoJobRow[] {
  const morning = new Date();
  morning.setHours(9, 0, 0, 0);
  const afternoon = new Date();
  afternoon.setHours(13, 30, 0, 0);

  return [
    {
      id: DEMO_JOB_IDS.morning,
      scheduled_start: morning.toISOString(),
      address_line: "428 Castro St",
      city: "San Francisco",
      state: "CA",
      zip: "94114",
      status: "scheduled",
      price_cents: 220_00,
      lat: 37.7614,
      lng: -122.4348,
      property_type: "residential",
      service_tier: "deep_clean",
      customer_notes: "Please use side entrance. Cat friendly — she hides under the bed.",
    },
    {
      id: DEMO_JOB_IDS.afternoon,
      scheduled_start: afternoon.toISOString(),
      address_line: "88 2nd St · Suite 400",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
      status: "scheduled",
      price_cents: 185_00,
      lat: 37.7879,
      lng: -122.4001,
      property_type: "office",
      service_tier: "standard",
    },
  ];
}

export function buildDemoChecklist(): DemoCheckRow[] {
  return [
    {
      id: "b0000000-0000-4000-8000-000000000011",
      job_id: DEMO_JOB_IDS.morning,
      room_key: "kitchen",
      label: "Kitchen · counters, sink, appliances",
      requires_photo: true,
      completed_at: null,
      photo_url: null,
    },
    {
      id: "b0000000-0000-4000-8000-000000000012",
      job_id: DEMO_JOB_IDS.morning,
      room_key: "bath",
      label: "Master bath · photo proof",
      requires_photo: true,
      completed_at: null,
      photo_url: null,
    },
    {
      id: "b0000000-0000-4000-8000-000000000013",
      job_id: DEMO_JOB_IDS.morning,
      room_key: "living",
      label: "Living room · vacuum & surfaces",
      requires_photo: false,
      completed_at: null,
      photo_url: null,
    },
    {
      id: "b0000000-0000-4000-8000-000000000021",
      job_id: DEMO_JOB_IDS.afternoon,
      room_key: "open_office",
      label: "Open office · desks & floors",
      requires_photo: false,
      completed_at: null,
      photo_url: null,
    },
    {
      id: "b0000000-0000-4000-8000-000000000022",
      job_id: DEMO_JOB_IDS.afternoon,
      room_key: "break_room",
      label: "Break room · kitchenette",
      requires_photo: true,
      completed_at: null,
      photo_url: null,
    },
  ];
}
