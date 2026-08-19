import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Manage users" showStats={false} rows={6} />;
}
