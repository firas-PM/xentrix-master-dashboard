import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Team utilization" showStats={false} rows={5} />;
}
