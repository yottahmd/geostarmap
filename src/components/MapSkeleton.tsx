export function MapSkeleton() {
  return (
    <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] rounded-lg overflow-hidden shadow-sm border bg-gray-100 animate-pulse">
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-gray-400">
          <svg
            className="h-12 w-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
