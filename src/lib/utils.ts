import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safe path for same-origin redirects only (blocks open redirects like `//evil.com`).
 */
export function sanitizeInternalPath(
  path: string | null | undefined,
  fallback = "/portal"
): string {
  if (path == null || typeof path !== "string") return fallback;
  const t = path.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("..") || t.includes("\\") || t.includes("\0")) return fallback;
  return t;
}
