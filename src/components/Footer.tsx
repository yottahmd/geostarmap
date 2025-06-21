export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="text-center text-xs text-gray-400">
          <p>
            City data from{' '}
            <a
              href="https://simplemaps.com/data/world-cities"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              SimpleMaps World Cities Database
            </a>{' '}
            (CC BY 4.0)
          </p>
        </div>
      </div>
    </footer>
  );
}