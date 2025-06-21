import type { GitHubUser, GeocodedLocation } from '../types';

interface StatisticsProps {
  users: GitHubUser[];
  locations: Map<string, GeocodedLocation | null>;
}

export function Statistics({ users, locations }: StatisticsProps) {
  const usersWithLocation = users.filter((user) => user.location).length;
  const geocodedCount = Array.from(locations.values()).filter(
    (loc) => loc !== null,
  ).length;
  const uniqueLocations = new Set(users.map((u) => u.location).filter(Boolean))
    .size;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <p className="text-2xl font-bold text-gray-100">{users.length}</p>
        <p className="text-xs text-gray-400">Total Stars</p>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <p className="text-2xl font-bold text-gray-100">{usersWithLocation}</p>
        <p className="text-xs text-gray-400">With Location</p>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <p className="text-2xl font-bold text-gray-100">{uniqueLocations}</p>
        <p className="text-xs text-gray-400">Unique Places</p>
      </div>
      <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
        <p className="text-2xl font-bold text-gray-100">{geocodedCount}</p>
        <p className="text-xs text-gray-400">Mapped</p>
      </div>
    </div>
  );
}
