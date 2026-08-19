import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Team" showStats={false} rows={4} />;
}
