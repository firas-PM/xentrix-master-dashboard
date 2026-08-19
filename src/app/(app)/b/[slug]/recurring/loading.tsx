import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Recurring tasks" showStats={false} rows={4} />;
}
