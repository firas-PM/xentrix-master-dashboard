import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Activity" showStats={false} rows={6} />;
}
