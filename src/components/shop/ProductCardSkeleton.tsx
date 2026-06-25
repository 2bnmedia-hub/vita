export function ProductCardSkeleton() {
  return (
    <div className="bg-navy-800 border border-white/[0.07] rounded-2xl overflow-hidden flex flex-col animate-pulse">
      {/* Image area */}
      <div className="h-52 bg-navy-900" />

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Flavor */}
        <div className="h-3 w-16 bg-navy-700 rounded-full" />
        {/* Name */}
        <div className="h-4 w-3/4 bg-navy-700 rounded-full" />
        <div className="h-4 w-1/2 bg-navy-700 rounded-full" />
        {/* Specs chips */}
        <div className="flex gap-2">
          <div className="h-5 w-12 bg-navy-700 rounded-md" />
          <div className="h-5 w-16 bg-navy-700 rounded-md" />
          <div className="h-5 w-10 bg-navy-700 rounded-md" />
        </div>
        {/* Stars */}
        <div className="h-3 w-24 bg-navy-700 rounded-full" />
        <div className="flex-1" />
        {/* Price + button */}
        <div className="flex items-center justify-between mt-2">
          <div className="h-7 w-16 bg-navy-700 rounded-full" />
          <div className="h-9 w-20 bg-navy-700 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
