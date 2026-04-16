/** Browser `fetch` throws `TypeError: Failed to fetch` for DNS, offline, CORS, aborted connections, etc. */
export function friendlyFetchFailureMessage(err: unknown): string {
  if (err instanceof TypeError && /failed to fetch/i.test(String(err.message))) {
    return (
      "We could not reach the server (network error). Check your internet connection, " +
      "refresh the page, and if you are developing locally make sure `npm run dev` is running."
    );
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}

/** Default init so session cookies are sent to same-origin App Router API routes. */
export const sameOriginJsonPost: RequestInit = {
  method: "POST",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json" },
};

export const sameOriginJsonPatch: RequestInit = {
  method: "PATCH",
  credentials: "same-origin",
  headers: { "Content-Type": "application/json" },
};
