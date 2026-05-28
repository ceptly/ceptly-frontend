import { DefaultPageSkeleton } from "@/components/page-skeletons";

interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className }: PageLoadingProps) {
  return <DefaultPageSkeleton className={className} />;
}
