import type { GitHubUser, Repository, AppError } from '../types';

interface GraphQLStargazerNode {
  login: string;
  id: number;
  avatarUrl: string;
  location: string | null;
}

interface GraphQLResponse {
  data: {
    repository: {
      stargazerCount: number;
      stargazers: {
        pageInfo: {
          hasNextPage: boolean;
          endCursor: string | null;
        };
        nodes: GraphQLStargazerNode[];
      };
    };
  };
  errors?: Array<{ message: string }>;
}

interface StargazerAPIResponse {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_GRAPHQL_API = 'https://api.github.com/graphql';

export class GitHubService {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  setToken(token: string | undefined) {
    this.token = token;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      Accept: 'application/vnd.github.v3+json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  parseRepositoryUrl(url: string): Repository | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      if (
        urlObj.hostname === 'github.com' &&
        pathParts.length >= 2 &&
        !pathParts[0].includes('.')
      ) {
        return {
          owner: pathParts[0],
          name: pathParts[1],
        };
      }
    } catch {
      // Invalid URL
    }

    return null;
  }

  async fetchStargazersGraphQL(
    repo: Repository,
    onProgress?: (fetched: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<GitHubUser[]> {
    if (!this.token) {
      // GraphQL requires authentication
      return this.fetchStargazersREST(repo, onProgress, signal);
    }

    const query = `
      query($owner: String!, $name: String!, $after: String) {
        repository(owner: $owner, name: $name) {
          stargazerCount
          stargazers(first: 100, after: $after) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              login
              id: databaseId
              avatarUrl
              location
              url: url
            }
          }
        }
      }
    `;

    const users: GitHubUser[] = [];
    let hasNextPage = true;
    let after: string | null = null;
    let totalCount = 0;

    try {
      while (hasNextPage && users.length < 5000) {
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        const response = await fetch(GITHUB_GRAPHQL_API, {
          method: 'POST',
          headers: {
            ...this.getHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query,
            variables: { owner: repo.owner, name: repo.name, after },
          }),
          signal,
        });

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const data: GraphQLResponse = await response.json();
        
        if (data.errors) {
          throw new Error(data.errors[0].message);
        }

        const repository = data.data.repository;
        totalCount = repository.stargazerCount;
        const stargazers = repository.stargazers;

        // Map all users, not just those with locations
        const mappedUsers = stargazers.nodes
          .map((user: GraphQLStargazerNode) => ({
            id: user.id,
            login: user.login,
            avatar_url: user.avatarUrl,
            html_url: `https://github.com/${user.login}`,
            location: user.location || undefined,
          }));

        users.push(...mappedUsers);

        // For progress, count processed users, not just those with locations
        if (onProgress) {
          const processedCount = Math.min(users.length, 5000);
          onProgress(processedCount, Math.min(totalCount, 5000));
        }

        hasNextPage = stargazers.pageInfo.hasNextPage;
        after = stargazers.pageInfo.endCursor;
      }

      return users;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch stargazers');
    }
  }

  async fetchStargazers(
    repo: Repository,
    onProgress?: (fetched: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<GitHubUser[]> {
    // Try GraphQL first if we have a token
    if (this.token) {
      try {
        return await this.fetchStargazersGraphQL(repo, onProgress, signal);
      } catch (error) {
        console.warn('GraphQL failed, falling back to REST API:', error);
      }
    }
    
    return this.fetchStargazersREST(repo, onProgress, signal);
  }

  async fetchStargazersREST(
    repo: Repository,
    onProgress?: (fetched: number, total: number) => void,
    signal?: AbortSignal,
  ): Promise<GitHubUser[]> {
    const users: GitHubUser[] = [];
    let page = 1;
    const perPage = 100;
    let totalCount = 0;

    try {
      // First, get the total count
      const repoResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}`,
        { headers: this.getHeaders(), signal },
      );

      if (!repoResponse.ok) {
        throw await this.handleErrorResponse(repoResponse);
      }

      const repoData = await repoResponse.json();
      totalCount = repoData.stargazers_count;

      // Fetch stargazers with pagination
      while (true) {
        // Check if aborted
        if (signal?.aborted) {
          throw new Error('Operation cancelled');
        }

        const url = new URL(
          `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/stargazers`,
        );
        url.searchParams.set('per_page', perPage.toString());
        url.searchParams.set('page', page.toString());

        const response = await fetch(url.toString(), {
          headers: this.getHeaders(),
          signal,
        });

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const stargazerData = await response.json();

        // If we have a token, fetch full user data to get locations
        if (this.token) {
          const detailedUsers = await Promise.all(
            stargazerData.map(async (user: StargazerAPIResponse) => {
              try {
                const userResponse = await fetch(`${GITHUB_API_BASE}/users/${user.login}`, {
                  headers: this.getHeaders(),
                  signal,
                });
                if (userResponse.ok) {
                  return userResponse.json();
                }
              } catch {
                // Ignore individual user fetch errors
              }
              return user;
            }),
          );
          users.push(...detailedUsers);
        } else {
          // Without token, we won't have location data
          users.push(...stargazerData);
        }

        if (onProgress) {
          onProgress(
            users.length,
            Math.min(totalCount, 5000),
          );
        }

        // Check if there are more pages
        const linkHeader = response.headers.get('Link');
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
          break;
        }

        page++;

        // Limit total users to avoid excessive API calls
        if (users.length >= 5000) {
          break;
        }
      }

      return users;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch stargazers');
    }
  }

  private async handleErrorResponse(response: Response): Promise<Error> {
    let errorData: { message?: string } = {};
    try {
      errorData = await response.json();
    } catch {
      // Failed to parse error response
    }

    const error = new Error(
      errorData.message || `HTTP ${response.status}: ${response.statusText}`,
    ) as Error & { type: AppError['type'] };

    switch (response.status) {
      case 403:
        if (errorData.message?.includes('rate limit')) {
          error.type = 'rate_limit';
          error.message =
            'GitHub API rate limit exceeded. Please try again later or add an API token.';
        } else {
          error.type = 'rate_limit';
          error.message = 'Access forbidden. Please check your API token.';
        }
        break;
      case 404:
        error.type = 'not_found';
        error.message = 'Repository not found. Please check the URL.';
        break;
      default:
        error.type = 'network';
        break;
    }

    return error;
  }

  async checkRateLimit(): Promise<{
    limit: number;
    remaining: number;
    reset: Date;
  }> {
    const response = await fetch(`${GITHUB_API_BASE}/rate_limit`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to check rate limit');
    }

    const data = await response.json();
    return {
      limit: data.rate.limit,
      remaining: data.rate.remaining,
      reset: new Date(data.rate.reset * 1000),
    };
  }
}
