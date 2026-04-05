import { Skeleton } from './Skeleton';

export const ViewLoader = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-6 border-b border-border-main pb-10">
        <div className="flex justify-between items-end">
          <div className="space-y-3">
            <Skeleton className="h-12 w-64 rounded-xl" />
            <Skeleton className="h-4 w-96 rounded-lg opacity-50" />
          </div>
          <Skeleton className="hidden lg:block h-10 w-48 rounded-full opacity-30" />
        </div>
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <Skeleton className="h-[300px] w-full rounded-2xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-[250px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default ViewLoader;
