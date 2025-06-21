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
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        <p className="text-xs text-gray-600">Total Stars</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="text-2xl font-bold text-gray-900">{usersWithLocation}</p>
        <p className="text-xs text-gray-600">With Location</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="text-2xl font-bold text-gray-900">{uniqueLocations}</p>
        <p className="text-xs text-gray-600">Unique Places</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <p className="text-2xl font-bold text-gray-900">{geocodedCount}</p>
        <p className="text-xs text-gray-600">Mapped</p>
      </div>
    </div>
  );
}
