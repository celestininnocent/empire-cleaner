/** Standard room checklist; Kitchen + Master Bath require photos before complete. */

export const DEFAULT_ROOMS: { room_key: string; label: string; requires_photo: boolean }[] =
  [
    { room_key: "kitchen", label: "Kitchen", requires_photo: true },
    { room_key: "living", label: "Living areas", requires_photo: false },
    { room_key: "master_bath", label: "Master bath", requires_photo: true },
    { room_key: "guest_baths", label: "Additional baths", requires_photo: false },
    { room_key: "bedrooms", label: "Bedrooms", requires_photo: false },
  ];
