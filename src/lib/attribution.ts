export type AttributionPayload = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referrerUrl: string;
  landingPath: string;
};

const MAX_SHORT = 120;
const MAX_URL = 500;

function clean(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function sanitizeAttributionInput(raw: Partial<AttributionPayload>): AttributionPayload {
  return {
    utmSource: clean(raw.utmSource ?? "", MAX_SHORT),
    utmMedium: clean(raw.utmMedium ?? "", MAX_SHORT),
    utmCampaign: clean(raw.utmCampaign ?? "", MAX_SHORT),
    utmContent: clean(raw.utmContent ?? "", MAX_SHORT),
    utmTerm: clean(raw.utmTerm ?? "", MAX_SHORT),
    referrerUrl: clean(raw.referrerUrl ?? "", MAX_URL),
    landingPath: clean(raw.landingPath ?? "", 300),
  };
}

export function getReferrerHost(referrerUrl: string): string {
  const v = referrerUrl.trim();
  if (!v) return "";
  try {
    return new URL(v).host.slice(0, 200);
  } catch {
    return "";
  }
}
