export function Header() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 flex-shrink-0 text-blue-600 font-bold text-lg">
            🌍
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">
            GeoStarMap
          </h1>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-gray-600">
          Visualize GitHub stargazers on a world map
        </p>
      </div>
    </header>
  );
}
