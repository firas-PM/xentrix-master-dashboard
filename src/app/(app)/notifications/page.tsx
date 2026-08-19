import { requireSession } from "@/lib/access";
import { getUserNotifications, getUnreadCount } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/primitives";
import { NotificationRow } from "./notification-row";
import { MarkAllReadButton } from "./mark-all-read-button";

export default async function NotificationsPage() {
  const session = await requireSession();
  const [rows, unread] = await Promise.all([
    getUserNotifications(session.user.id, 100),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle={
          unread === 0
            ? "You're all caught up."
            : `${unread} unread · showing the latest ${rows.length}.`
        }
      >
        <MarkAllReadButton unreadCount={unread} />
      </PageHeader>
      <div className="p-8">
        {rows.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            hint="You'll get an item here whenever someone @-mentions you or assigns you a task."
          />
        ) : (
          <div className="space-y-2 max-w-3xl">
            {rows.map((n) => (
              <NotificationRow
                key={n.id}
                n={{
                  ...n,
                  createdAt: n.createdAt.toISOString(),
                  readAt: n.readAt ? n.readAt.toISOString() : null,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
