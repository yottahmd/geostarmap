# GeoStarMap - GitHub Stars Geography Visualizer

A web application that visualizes the geographic distribution of GitHub repository stargazers on an interactive world map.

## Features

- Input any public GitHub repository URL
- View stargazer locations on an interactive map
- Optional GitHub API token support for higher rate limits
- Progress tracking while processing users
- Cached geocoding results for performance
- Fully responsive design

## Development

### Prerequisites

- Node.js 18+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format
```

## Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Leaflet for maps
- OpenStreetMap for geocoding
