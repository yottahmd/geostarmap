export function validateGitHubUrl(url: string): {
  valid: boolean;
  error?: string;
} {
  if (!url) {
    return { valid: false, error: 'Please enter a repository URL' };
  }

  try {
    const urlObj = new URL(url);

    if (urlObj.hostname !== 'github.com') {
      return { valid: false, error: 'URL must be from github.com' };
    }

    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts.length < 2) {
      return {
        valid: false,
        error: 'URL must include owner and repository name',
      };
    }

    if (pathParts[0].includes('.') || pathParts[1].includes('.')) {
      return { valid: false, error: 'Invalid repository format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function formatRepoUrl(owner: string, name: string): string {
  return `https://github.com/${owner}/${name}`;
}
