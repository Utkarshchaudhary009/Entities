import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
    return (
        <div className="container py-8">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Gallery Skeleton */}
                <div className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-20 flex-shrink-0 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Details Skeleton */}
                <div className="flex flex-col">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="mt-4 h-10 w-3/4" />
                    <Skeleton className="mt-4 h-8 w-1/4" />

                    <div className="space-y-2 mt-6">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>

                    <div className="mt-6">
                        <Skeleton className="h-4 w-12" />
                        <div className="mt-2 flex gap-2">
                            <Skeleton className="h-9 w-12" />
                            <Skeleton className="h-9 w-12" />
                            <Skeleton className="h-9 w-12" />
                        </div>
                    </div>

                    <div className="mt-8">
                        <Skeleton className="h-12 w-full rounded-md" />
                    </div>

                    <div className="mt-8 border-t pt-6 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
