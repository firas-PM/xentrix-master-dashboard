"use client";

import { useState, useTransition } from "react";
import { addTaskComment } from "@/lib/actions/task-actions";
import { formatDistanceToNowStrict } from "date-fns";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { name: string; email: string } | null;
};

export function TaskComments({
  brandSlug,
  taskId,
  comments,
}: {
  brandSlug: string;
  taskId: string;
  comments: Comment[];
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-xs text-neutral-500">No comments yet.</p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div className="h-7 w-7 shrink-0 rounded-full bg-neutral-800 grid place-items-center text-[10px] uppercase">
              {(c.author?.name ?? "??").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium">{c.author?.name ?? "Unknown"}</span>
                <span className="text-[10px] text-neutral-500">
                  {formatDistanceToNowStrict(new Date(c.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-neutral-300 whitespace-pre-wrap mt-0.5">
                {c.body}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <form
        className="pt-2 border-t border-neutral-900 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          const val = body.trim();
          if (!val) return;
          start(async () => {
            await addTaskComment({ brandSlug, taskId, body: val });
            setBody("");
          });
        }}
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write a comment…"
          className="w-full rounded-md bg-neutral-900 border border-neutral-800 px-3 py-2 text-sm"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-md bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-sm px-4 py-2"
          >
            {pending ? "Posting…" : "Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}
