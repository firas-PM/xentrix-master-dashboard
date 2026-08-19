import { PageSkeleton } from "@/components/primitives";

export default function Loading() {
  return <PageSkeleton title="Inbox" showStats={false} rows={5} />;
}
