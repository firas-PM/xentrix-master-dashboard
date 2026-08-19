import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Manage brands" showStats={false} rows={5} />;
}
