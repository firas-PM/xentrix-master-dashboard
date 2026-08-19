import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Task templates" showStats={false} rows={4} />;
}
