import { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { RepoInput } from './components/RepoInput';
import { ProgressBar } from './components/ProgressBar';
import { MapView } from './components/Map';
import { Statistics } from './components/Statistics';
import { GitHubService } from './services/github';
import { GeocodingService } from './services/geocoding';
import { CacheService } from './services/cache';
import type { GitHubUser, GeocodedLocation, ProcessingProgress } from './types';

function App() {
  const [users, setUsers] = useState<GitHubUser[]>([]);
  const [locations, setLocations] = useState<
    Map<string, GeocodedLocation | null>
  >(new Map());
  const [progress, setProgress] = useState<ProcessingProgress>({
    status: 'idle',
    current: 0,
    total: 0,
    message: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const githubService = useMemo(() => new GitHubService(), []);
  const geocodingService = useMemo(() => new GeocodingService(), []);
  const cacheService = useMemo(() => new CacheService(), []);

  const handleCancel = useCallback(() => {
    // Abort any ongoing fetch requests
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    // Clear geocoding queue
    geocodingService.clearQueue();

    // Reset state
    setIsProcessing(false);
    setProgress({
      status: 'idle',
      current: 0,
      total: 0,
      message: '',
    });
  }, [geocodingService, abortController]);

  const processRepository = useCallback(
    async (url: string, token?: string) => {
      // Create new AbortController for this operation
      const controller = new AbortController();
      setAbortController(controller);

      try {
        setIsProcessing(true);
        setUsers([]);
        setLocations(new Map());

        // Set token if provided
        if (token) {
          githubService.setToken(token);
        }

        // Parse repository from URL
        const repo = githubService.parseRepositoryUrl(url);
        if (!repo) {
          throw new Error('Invalid repository URL');
        }

        // Fetch stargazers
        setProgress({
          status: 'fetching',
          current: 0,
          total: 0,
          message: 'Fetching stargazers...',
        });

        const stargazers = await githubService.fetchStargazers(
          repo,
          (fetched, total) => {
            setProgress({
              status: 'fetching',
              current: fetched,
              total,
              message: `Fetching stargazers... (${fetched}/${total})`,
            });
          },
          controller.signal,
        );

        setUsers(stargazers);

        // Extract unique locations
        const uniqueLocations = [
          ...new Set(
            stargazers
              .map((user) => user.location)
              .filter((location): location is string => !!location),
          ),
        ];

        if (uniqueLocations.length === 0) {
          setProgress({
            status: 'error',
            current: 0,
            total: 0,
            message:
              'No users with location data found. Please add a GitHub API token to fetch location data.',
          });
          setIsProcessing(false);
          return;
        }

        // Process locations
        setProgress({
          status: 'geocoding',
          current: 0,
          total: uniqueLocations.length,
          message: 'Geocoding locations...',
        });

        const locationMap = new Map<string, GeocodedLocation | null>();

        for (let i = 0; i < uniqueLocations.length; i++) {
          // Check if cancelled
          if (controller.signal.aborted) {
            throw new Error('Operation cancelled');
          }

          const location = uniqueLocations[i];

          // Check cache first
          let geocoded = cacheService.get(location);

          if (!geocoded) {
            // Not in cache, fetch from API
            geocoded = await geocodingService.geocodeLocation(location);

            // Cache the result (even if null)
            if (geocoded) {
              cacheService.set(location, geocoded);
            }
          }

          locationMap.set(location, geocoded);
          setLocations(new Map(locationMap));

          setProgress({
            status: 'geocoding',
            current: i + 1,
            total: uniqueLocations.length,
            message: `Geocoding locations... (${i + 1}/${uniqueLocations.length})`,
          });
        }

        setProgress({
          status: 'complete',
          current: uniqueLocations.length,
          total: uniqueLocations.length,
          message: 'Analysis complete!',
        });
      } catch (error) {
        console.error('Processing error:', error);

        // Check if it was cancelled
        if (error instanceof Error && error.message === 'Operation cancelled') {
          // Already handled in handleCancel
          return;
        }

        setProgress({
          status: 'error',
          current: 0,
          total: 0,
          message: error instanceof Error ? error.message : 'An error occurred',
        });
      } finally {
        setIsProcessing(false);
        setAbortController(null);
      }
    },
    [githubService, geocodingService, cacheService],
  );

  const showMap = users.length > 0 && locations.size > 0;

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <RepoInput onSubmit={processRepository} disabled={isProcessing} />

          <ProgressBar progress={progress} onCancel={handleCancel} />

          {showMap && (
            <div className="mt-8">
              <Statistics users={users} locations={locations} />
              <MapView users={users} locations={locations} />

              {/* Show users without valid locations */}
              {(() => {
                const invalidLocationUsers = users.filter(
                  (user) => user.location && !locations.get(user.location),
                );

                if (invalidLocationUsers.length > 0) {
                  return (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg shadow-sm border border-gray-700">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        Unable to geocode {invalidLocationUsers.length} user
                        {invalidLocationUsers.length !== 1 ? 's' : ''}:
                      </h3>
                      <div className="text-xs text-gray-400 max-h-32 overflow-y-auto">
                        {invalidLocationUsers.map((user, index) => (
                          <div key={user.id}>
                            <a
                              href={user.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:underline"
                            >
                              {user.login}
                            </a>
                            : {user.location}
                            {index < invalidLocationUsers.length - 1 && ', '}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
