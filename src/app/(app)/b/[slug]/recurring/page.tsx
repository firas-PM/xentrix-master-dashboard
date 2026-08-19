import { getBrandBySlug } from "@/lib/brands";
import { canManageBrand } from "@/lib/access";
import { connectDb } from "@/lib/mongoose";
import { RecurringTaskTemplate } from "@/models";
import { listBrandMembers } from "@/lib/actions/task-actions";
import { PageHeader, Card, EmptyState, Pill } from "@/components/primitives";
import { NewRecurringForm } from "./new-recurring-form";
import { RecurringRowActions } from "./recurring-row-actions";
import type {
  RecurrenceFreq,
  TaskKind,
  TaskPriority,
} from "@/models/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function RecurringPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const brand = await getBrandBySlug(slug);
  const canManage = await canManageBrand(slug);
  await connectDb();
  const [templates, members] = await Promise.all([
    RecurringTaskTemplate.find({ brandId: brand._id })
      .sort({ active: -1, title: 1 })
      .lean(),
    listBrandMembers(slug),
  ]);

  return (
    <div>
      <PageHeader
        title="Recurring tasks"
        subtitle={`Auto-created ${templates.filter((t) => t.active).length} × per schedule for ${brand.name}. Runs from the daily cron.`}
      />
      <div className="p-8 space-y-6">
        {canManage && (
          <Card>
            <NewRecurringForm brandSlug={slug} members={members} />
          </Card>
        )}

        {templates.length === 0 ? (
          <EmptyState
            title="No recurring tasks yet"
            hint="Great for opening checklists, weekly stock, monthly reports."
          />
        ) : (
          <div className="space-y-2">
            {templates.map((t) => {
              const s = t.schedule as {
                daysOfWeek?: number[];
                dayOfMonth?: number;
                time: string;
              };
              const scheduleLabel =
                t.frequency === "daily"
                  ? `Every day at ${s.time}`
                  : t.frequency === "weekly"
                    ? `${(s.daysOfWeek ?? []).map((d) => DAYS[d]).join(", ")} at ${s.time}`
                    : `Day ${s.dayOfMonth ?? "?"} of month at ${s.time}`;
              return (
                <Card key={String(t._id)} className={!t.active ? "opacity-60" : undefined}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        {!t.active && <Pill tone="neutral">Paused</Pill>}
                      </div>
                      <div className="text-[11px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="capitalize">{t.frequency}</span>
                        <span>·</span>
                        <span>{scheduleLabel}</span>
                        <span>·</span>
                        <span className="capitalize">{t.kind}</span>
                        <span>·</span>
                        <span className="capitalize">{t.priority}</span>
                      </div>
                    </div>
                    {canManage && (
                      <RecurringRowActions
                        brandSlug={slug}
                        templateId={String(t._id)}
                        active={t.active}
                        members={members}
                        editable={{
                          id: String(t._id),
                          title: t.title,
                          kind: t.kind as TaskKind,
                          priority: t.priority as TaskPriority,
                          defaultAssigneeId: t.defaultAssigneeId
                            ? String(t.defaultAssigneeId)
                            : "",
                          frequency: t.frequency as RecurrenceFreq,
                          time: (t.schedule as { time: string }).time,
                          daysOfWeek:
                            ((t.schedule as { daysOfWeek?: number[] })
                              .daysOfWeek ?? []),
                          dayOfMonth:
                            (t.schedule as { dayOfMonth?: number })
                              .dayOfMonth ?? 1,
                        }}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
