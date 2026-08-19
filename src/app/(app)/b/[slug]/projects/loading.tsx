import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Projects" showStats={false} rows={4} />;
}
