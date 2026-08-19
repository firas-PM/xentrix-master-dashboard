"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import {
  addTaskAttachment,
  removeTaskAttachment,
} from "@/lib/actions/attachment-actions";
import { formatDistanceToNowStrict } from "date-fns";

export type Attachment = {
  url: string;
  pathname: string;
  name: string;
  size?: number | null;
  contentType?: string | null;
  uploadedAt: string;
};

export function TaskAttachments({
  brandSlug,
  taskId,
  attachments,
  uploadsEnabled,
}: {
  brandSlug: string;
  taskId: string;
  attachments: Attachment[];
  uploadsEnabled: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();
  const [progress, setProgress] = useState<{ name: string; pct: number } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    if (!uploadsEnabled) {
      setError(
        "File uploads aren't configured yet. Ask an admin to set BLOB_READ_WRITE_TOKEN on the Vercel project."
      );
      return;
    }
    try {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const pathname = `${brandSlug}/${taskId}/${Date.now()}-${safeName}`;
      setProgress({ name: file.name, pct: 0 });
      const blob = await upload(pathname, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        onUploadProgress: (p) =>
          setProgress({ name: file.name, pct: Math.round(p.percentage) }),
      });
      start(async () => {
        const res = await addTaskAttachment({
          brandSlug,
          taskId,
          url: blob.url,
          pathname: blob.pathname,
          name: file.name,
          size: file.size,
          contentType: file.type || undefined,
        });
        if (res.ok) {
          setProgress(null);
          router.refresh();
        } else {
          setError(res.error);
          setProgress(null);
        }
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending || Boolean(progress)}
          className="text-sm font-medium rounded-md border border-[var(--border-strong)] hover:border-[var(--text-muted)] hover:bg-[var(--bg-sunken)] px-3 py-1.5 transition disabled:opacity-50"
        >
          {progress ? `${progress.pct}% · ${progress.name}` : "Upload file"}
        </button>
        {!uploadsEnabled && (
          <p className="text-[11px] text-[var(--text-subtle)] mt-1">
            File uploads inactive — set{" "}
            <code className="font-mono text-xs bg-[var(--bg-sunken)] rounded px-1">
              BLOB_READ_WRITE_TOKEN
            </code>{" "}
            on this Vercel project to enable.
          </p>
        )}
        {error && <p className="text-xs text-[var(--danger)] mt-1">{error}</p>}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-[var(--text-subtle)]">
          No files attached yet.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.pathname}
              className="flex items-center gap-3 text-sm border-b border-[var(--border)] last:border-b-0 pb-1.5"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noreferrer"
                className="flex-1 min-w-0 truncate hover:underline"
                title={a.name}
              >
                {a.name}
              </a>
              <span className="text-[10px] text-[var(--text-subtle)] shrink-0">
                {a.size ? formatSize(a.size) : "—"} ·{" "}
                {formatDistanceToNowStrict(new Date(a.uploadedAt), {
                  addSuffix: true,
                })}
              </span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Remove "${a.name}"?`)) return;
                  start(async () => {
                    await removeTaskAttachment({
                      brandSlug,
                      taskId,
                      pathname: a.pathname,
                    });
                  });
                }}
                aria-label="Remove attachment"
                className="text-[var(--text-muted)] hover:text-[var(--danger)] text-sm px-2 transition disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
