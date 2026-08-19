import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="My work" showStats={false} rows={6} />;
}
