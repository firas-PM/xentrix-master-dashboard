"use client";

import { useState, useTransition } from "react";
import {
  addTaskComment,
  editTaskComment,
  deleteTaskComment,
} from "@/lib/actions/task-actions";
import { formatDistanceToNowStrict } from "date-fns";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  editedAt: string | null;
  authorId: string;
  author: { name: string; email: string } | null;
};

export function TaskComments({
  brandSlug,
  taskId,
  comments,
  currentUserId,
  isFounder,
}: {
  brandSlug: string;
  taskId: string;
  comments: Comment[];
  currentUserId: string;
  isFounder: boolean;
}) {
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      {comments.length === 0 && (
        <p className="text-xs text-[var(--text-subtle)]">No comments yet.</p>
      )}

      <ul className="space-y-3">
        {comments.map((c) => (
          <CommentRow
            key={c.id}
            brandSlug={brandSlug}
            taskId={taskId}
            comment={c}
            canEdit={c.authorId === currentUserId}
            canDelete={c.authorId === currentUserId || isFounder}
          />
        ))}
      </ul>

      <form
        className="pt-2 border-t border-[var(--border)] space-y-2"
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
          placeholder="Write a comment… @mention teammates by name"
          className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-sm font-semibold px-4 py-2 transition"
          >
            {pending ? "Posting…" : "Comment"}
          </button>
        </div>
      </form>
    </div>
  );
}

function CommentRow({
  brandSlug,
  taskId,
  comment,
  canEdit,
  canDelete,
}: {
  brandSlug: string;
  taskId: string;
  comment: Comment;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <li className="flex gap-3">
      <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--bg-sunken)] border border-[var(--border)] grid place-items-center text-[10px] uppercase font-semibold text-[var(--text-muted)]">
        {(comment.author?.name ?? "??").slice(0, 2)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {comment.author?.name ?? "Unknown"}
          </span>
          <span className="text-[10px] text-[var(--text-subtle)]">
            {formatDistanceToNowStrict(new Date(comment.createdAt), {
              addSuffix: true,
            })}
            {comment.editedAt && " · edited"}
          </span>
          {(canEdit || canDelete) && !editing && (
            <span className="ml-auto flex items-center gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("Delete this comment?")) return;
                    start(async () => {
                      await deleteTaskComment({
                        brandSlug,
                        taskId,
                        commentId: comment.id,
                      });
                    });
                  }}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--danger)] transition disabled:opacity-50"
                >
                  delete
                </button>
              )}
            </span>
          )}
        </div>

        {editing ? (
          <form
            className="mt-1 space-y-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const res = await editTaskComment({
                  brandSlug,
                  taskId,
                  commentId: comment.id,
                  body: draft,
                });
                if (res.ok) setEditing(false);
                else setError(res.error);
              });
            }}
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full rounded-md bg-[var(--bg-elevated)] border border-[var(--border-strong)] px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="rounded-md bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-[var(--accent-ink)] text-xs font-semibold px-2.5 py-1 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(comment.body);
                  setEditing(false);
                }}
                className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] transition"
              >
                Cancel
              </button>
              {error && (
                <span className="text-xs text-[var(--danger)]">{error}</span>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap mt-0.5">
            {comment.body}
          </p>
        )}
      </div>
    </li>
  );
}
