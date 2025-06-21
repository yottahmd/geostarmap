import { GitHubUser, Repository, AppError } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

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

  async fetchStargazers(
    repo: Repository,
    onProgress?: (fetched: number, total: number) => void,
  ): Promise<GitHubUser[]> {
    const users: GitHubUser[] = [];
    let page = 1;
    const perPage = 100;
    let totalCount = 0;

    try {
      // First, get the total count
      const repoResponse = await fetch(
        `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}`,
        { headers: this.getHeaders() },
      );

      if (!repoResponse.ok) {
        throw await this.handleErrorResponse(repoResponse);
      }

      const repoData = await repoResponse.json();
      totalCount = repoData.stargazers_count;

      // Fetch stargazers with pagination
      while (true) {
        const url = new URL(
          `${GITHUB_API_BASE}/repos/${repo.owner}/${repo.name}/stargazers`,
        );
        url.searchParams.set('per_page', perPage.toString());
        url.searchParams.set('page', page.toString());

        const response = await fetch(url.toString(), {
          headers: this.getHeaders(),
        });

        if (!response.ok) {
          throw await this.handleErrorResponse(response);
        }

        const data: GitHubUser[] = await response.json();
        users.push(...data);

        if (onProgress) {
          onProgress(users.length, totalCount);
        }

        // Check if there are more pages
        const linkHeader = response.headers.get('Link');
        if (!linkHeader || !linkHeader.includes('rel="next"')) {
          break;
        }

        page++;
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
