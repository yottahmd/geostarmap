# GeoStarMap - GitHub Stars Geography Visualizer

## Project Overview

GeoStarMap is a minimalist single-page application that visualizes the geographic distribution of GitHub repository stargazers on an interactive world map.

## Core Requirements

### Technical Stack

- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **UI Library**: shadcn/ui
- **Code Quality**: ESLint + Prettier
- **Map Library**: Leaflet with OpenStreetMap tiles
- **Architecture**: Client-side only SPA (no backend)

### Features

1. **Repository Input**: Accept GitHub repository URL (format: `https://github.com/owner/repo`)
2. **API Token Support**: Optional GitHub API token input (not persisted)
3. **Geographic Visualization**: Display stargazers' locations on an interactive map
4. **Progress Tracking**: Show real-time progress while processing users
5. **Caching**: Cache geocoded locations in localStorage to minimize API calls
6. **Responsive Design**: Mobile-first, works on all screen sizes

## Implementation Details

### GitHub API Integration

- **Endpoint**: `GET https://api.github.com/repos/{owner}/{repo}/stargazers`
- **Headers**:
  - Accept: `application/vnd.github.v3+json`
  - Authorization: `Bearer {token}` (if provided)
- **Pagination**: Handle `Link` header for repos with many stars
- **Rate Limits**:
  - Unauthenticated: 60 requests/hour
  - Authenticated: 5,000 requests/hour

### Geocoding Service

- **Service**: Nominatim (OpenStreetMap)
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Rate Limit**: 1 request per second (must be enforced client-side)
- **Query Format**: `?q={location}&format=json&limit=1`
- **User-Agent**: Required header with app name

### Caching Strategy

- **Storage**: localStorage
- **Key Format**: `geostarmap_cache_{normalized_location}`
- **Data Structure**:
  ```typescript
  {
    lat: number;
    lng: number;
    displayName: string;
    timestamp: number;
  }
  ```
- **Expiry**: 30 days
- **Size Limit**: Monitor localStorage quota (~5-10MB)

### UI Components

#### 1. Header

- App title and brief description
- Minimalist design with consistent spacing

#### 2. Input Section

- Repository URL input field
- "Analyze Repository" button
- Collapsible "Advanced Options" with API token input
- Clear visual feedback for invalid inputs

#### 3. Progress Indicator

- Show current operation: "Fetching stargazers...", "Geocoding locations..."
- Progress bar with percentage
- Cancel button for long operations

#### 4. Map View

- Full-width map container
- Marker clustering for better performance
- Popup on marker click showing:
  - GitHub username
  - Location string
  - Link to GitHub profile
- Zoom controls and fullscreen option

### Error Handling

- Invalid repository URL format
- Repository not found (404)
- Rate limit exceeded (403)
- Network errors
- Invalid/ungeocoded locations (show in a separate list)

### Performance Considerations

- Batch API requests where possible
- Implement request queue for geocoding
- Use React.memo for expensive components
- Lazy load map library
- Virtual scrolling for large user lists

### Design Principles

- **Minimalism**: Clean, uncluttered interface
- **Accessibility**: ARIA labels, keyboard navigation
- **Feedback**: Clear loading states and error messages
- **Privacy**: No data persistence beyond cache, no analytics

## File Structure

```
src/
├── components/
│   ├── Header.tsx
│   ├── RepoInput.tsx
│   ├── ProgressBar.tsx
│   ├── Map.tsx
│   └── ErrorBoundary.tsx
├── hooks/
│   ├── useGitHubAPI.ts
│   ├── useGeocoding.ts
│   └── useCache.ts
├── services/
│   ├── github.ts
│   ├── geocoding.ts
│   └── cache.ts
├── types/
│   └── index.ts
├── utils/
│   ├── rateLimit.ts
│   └── validation.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Development Guidelines

- Use conventional commits (feat:, fix:, docs:, etc.)
- Format all files with Prettier on save
- Follow React best practices and hooks rules
- Keep components small and focused
- Use TypeScript strict mode
- Minimize external dependencies

## Implementation Tasks

### Phase 1: Project Setup

- [x] Initialize Vite project with React and TypeScript template
- [x] Configure pnpm as package manager
- [x] Set up ESLint with React and TypeScript rules
- [x] Configure Prettier with format-on-save
- [x] Install and configure Tailwind CSS for shadcn/ui
- [x] Set up shadcn/ui with required components

### Phase 2: Core Services

- [ ] Create GitHub API service
  - [ ] Implement repository parsing from URL
  - [ ] Add stargazers fetching with pagination
  - [ ] Handle authentication headers
  - [ ] Add error handling for API responses
- [ ] Create geocoding service
  - [ ] Implement Nominatim API client
  - [ ] Add rate limiting queue (1 req/sec)
  - [ ] Handle geocoding errors gracefully
- [ ] Implement caching service
  - [ ] Create localStorage wrapper
  - [ ] Add cache expiry logic
  - [ ] Implement cache size management

### Phase 3: UI Components

- [ ] Create Header component with app branding
- [ ] Build RepoInput component
  - [ ] URL validation
  - [ ] Submit button with loading state
  - [ ] Collapsible API token section
- [ ] Implement ProgressBar component
  - [ ] Show current operation status
  - [ ] Display percentage complete
  - [ ] Add cancel functionality
- [ ] Create Map component
  - [ ] Integrate Leaflet
  - [ ] Add marker clustering
  - [ ] Implement popups with user info
  - [ ] Add zoom controls

### Phase 4: Integration

- [ ] Wire up components with services
- [ ] Implement main app flow
- [ ] Add global error boundary
- [ ] Create loading states
- [ ] Test with various repositories

### Phase 5: Polish

- [ ] Ensure mobile responsiveness
- [ ] Add keyboard navigation
- [ ] Optimize bundle size
- [ ] Add input validation feedback
- [ ] Create user-friendly error messages
- [ ] Test rate limiting behavior

## Testing Checklist

- [ ] Test with small repository (<100 stars)
- [ ] Test with large repository (>1000 stars)
- [ ] Test without API token (rate limits)
- [ ] Test with invalid repository URLs
- [ ] Test with users having no location
- [ ] Test cache functionality
- [ ] Test on mobile devices
- [ ] Test error scenarios

## Future Enhancements (Out of Scope)

- Export visualization as image
- Historical star growth animation
- Contributor location analysis
- Repository comparison mode
- Backend API for caching/analytics

## Git Commit Guidelines

- **NEVER EVER use `git add -A` or `git add .`** - ALWAYS stage specific files only
- **CRITICAL: Using `git add -A` is FORBIDDEN. Always use `git add <specific-file>`**
- Follow conventional commit format (fix:, feat:, docs:, etc.)
- Keep commit messages to one line unless body is absolutely necessary
- For commits fixing bugs or adding features based on user reports add:
  ```
  git commit --trailer "Reported-by:<name>"
  ```
  Where `<name>` is the name of the user
- For commits related to a Github issue, add:
  ```
  git commit --trailer "Github-Issue:#<number>"
  ```
- **NEVER mention co-authored-by or similar**
- **NEVER mention the tool used to create the commit message**
- **NEVER ever include _Generated with_ or similar in commit messages**
- **NEVER ever include _Co-Authored-By_ or similar in commit messages**
