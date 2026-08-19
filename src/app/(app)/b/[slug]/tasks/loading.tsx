import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Tasks" showStats={false} rows={5} />;
}
