"use client";

import { useMemo } from "react";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";

export type MapJob = {
  id: string;
  lat: number | null;
  lng: number | null;
  address_line: string;
  status: string;
  customer_notes?: string | null;
};

export type MapTeam = {
  id: string;
  base_lat: number;
  base_lng: number;
  name: string;
};

const defaultCenter = { lat: 37.7749, lng: -122.4194 };

export function DispatchMap({
  jobs,
  teams,
}: {
  jobs: MapJob[];
  teams: MapTeam[];
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const markers = useMemo(() => {
    const jobMarkers = jobs
      .filter((j) => j.lat != null && j.lng != null)
      .map((j) => {
        const note = j.customer_notes?.trim();
        const noteShort = note && note.length > 90 ? `${note.slice(0, 90)}…` : note;
        return {
          id: `job-${j.id}`,
          position: { lat: j.lat as number, lng: j.lng as number },
          title: noteShort ? `${j.address_line} — ${noteShort}` : j.address_line,
          kind: "job" as const,
        };
      });
    const teamMarkers = teams.map((t) => ({
      id: `team-${t.id}`,
      position: { lat: t.base_lat, lng: t.base_lng },
      title: t.name,
      kind: "team" as const,
    }));
    return [...teamMarkers, ...jobMarkers];
  }, [jobs, teams]);

  if (!key) {
    return (
      <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-8 text-center">
        <p className="font-medium text-foreground">Map preview disabled</p>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Add{" "}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to
          show live jobs and team bases. Below is the same data as a list.
        </p>
        <ul className="mt-6 w-full max-w-lg space-y-2 text-left text-sm">
          {teams.map((t) => (
            <li key={t.id} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-primary">{t.name}</span> · base{" "}
              {t.base_lat.toFixed(4)}, {t.base_lng.toFixed(4)}
            </li>
          ))}
          {jobs.map((j) => (
            <li key={j.id} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              {j.address_line} · {j.status}{" "}
              {j.lat != null && j.lng != null
                ? `· ${j.lat.toFixed(4)}, ${j.lng.toFixed(4)}`
                : ""}
              {j.customer_notes?.trim() ? (
                <span className="mt-1 block text-xs text-muted-foreground line-clamp-2">
                  {j.customer_notes.trim()}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <APIProvider apiKey={key}>
      <div className="h-[420px] overflow-hidden rounded-2xl border border-border/80 shadow-inner">
        <GoogleMap
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId="empire-cleaner-dispatch"
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {markers.map((m) => (
            <AdvancedMarker key={m.id} position={m.position} title={m.title}>
              <div
                className={
                  m.kind === "team"
                    ? "size-3 rounded-full border-2 border-white bg-primary shadow-md"
                    : "size-3 rounded-full border-2 border-white bg-amber-500 shadow-md"
                }
              />
            </AdvancedMarker>
          ))}
        </GoogleMap>
      </div>
    </APIProvider>
  );
}
