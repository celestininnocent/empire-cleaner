/**
 * Downscale large phone photos before upload so checklist saves stay fast and reliable.
 * Returns the original file if it is already small enough or if compression fails.
 */
export async function compressImageForUpload(
  file: File,
  opts?: { maxEdgePx?: number; maxBytes?: number; quality?: number }
): Promise<File> {
  const maxEdgePx = opts?.maxEdgePx ?? 1600;
  const maxBytes = opts?.maxBytes ?? 4_500_000;
  const quality = opts?.quality ?? 0.82;

  if (typeof window === "undefined" || !file.type.startsWith("image/")) {
    return file;
  }
  if (file.size <= maxBytes && file.type === "image/jpeg") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const w = bitmap.width;
    const h = bitmap.height;
    const scale = Math.min(1, maxEdgePx / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, tw, th);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
    );
    if (!blob || blob.size >= file.size) {
      return file;
    }
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
