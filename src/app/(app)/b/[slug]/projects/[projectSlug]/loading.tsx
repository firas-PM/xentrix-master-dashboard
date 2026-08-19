import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton showStats={false} rows={2} />;
}
