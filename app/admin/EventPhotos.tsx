"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resizeImage } from "@/lib/resize-image";

export type Photo = { id: string; url: string };

// Admin panel for one event's photo gallery: add several photos at once,
// show one first, or remove them.
export default function EventPhotos({ eventId, photos }: { eventId: string; photos: Photo[] }) {
  const router = useRouter();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setErrors([]);
    const failed: string[] = [];
    setProgress({ done: 0, total: files.length });
    // One at a time keeps each request under the upload size limit.
    for (const [i, original] of files.entries()) {
      try {
        const file = await resizeImage(original);
        const form = new FormData();
        form.append("file", file);
        const res = await fetch(`/api/admin/events/${eventId}/photos`, { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          failed.push(`${original.name}: ${body.error ?? "upload failed"}`);
        }
      } catch {
        failed.push(`${original.name}: couldn't read this image. Try exporting it as a JPEG.`);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setProgress(null);
    setErrors(failed);
    router.refresh();
  }

  async function act(photo: Photo, method: "PATCH" | "DELETE") {
    if (method === "DELETE" && !window.confirm("Remove this photo?")) return;
    setBusyId(photo.id);
    await fetch(`/api/admin/event-photos/${photo.id}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: method === "PATCH" ? JSON.stringify({ move: "first" }) : undefined,
    });
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-medium">
          Photos ({photos.length})
          <span className="ml-2 font-normal text-muted">Shown as a carousel on the event page.</span>
        </p>
        <label
          className={`cursor-pointer rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark ${progress ? "pointer-events-none opacity-60" : ""}`}
        >
          {progress
            ? `Uploading ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...`
            : "Add photos"}
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={add}
            disabled={!!progress}
          />
        </label>
      </div>

      {errors.length > 0 && (
        <ul className="text-sm text-red-600 list-disc pl-5">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-muted">No photos yet. You can select several at once.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <div key={p.id} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className={`aspect-square w-full rounded-md object-cover ${busyId === p.id ? "opacity-40" : ""}`}
              />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  First
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => act(p, "PATCH")}
                    disabled={!!busyId}
                    className="rounded bg-white/90 px-1.5 py-0.5 text-[11px] hover:bg-white"
                  >
                    Show first
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => act(p, "DELETE")}
                  disabled={!!busyId}
                  className="ml-auto rounded bg-white/90 px-1.5 py-0.5 text-[11px] text-red-600 hover:bg-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
