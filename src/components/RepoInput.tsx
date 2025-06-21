import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { validateGitHubUrl } from '../utils/validation';
import { cn } from '../lib/utils';

interface RepoInputProps {
  onSubmit: (url: string, token?: string) => void;
  disabled?: boolean;
}

export function RepoInput({ onSubmit, disabled }: RepoInputProps) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateGitHubUrl(url);
    if (!validation.valid) {
      setError(validation.error || 'Invalid URL');
      return;
    }

    setError('');
    onSubmit(url, token || undefined);
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (error) {
      const validation = validateGitHubUrl(value);
      if (validation.valid) {
        setError('');
      }
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="repo-url"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            GitHub Repository URL
          </label>
          <input
            id="repo-url"
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://github.com/owner/repository"
            className={cn(
              'w-full px-3 py-2 border rounded-md bg-gray-900 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              error ? 'border-red-300' : 'border-gray-700',
            )}
            disabled={disabled}
            required
          />
          {error && (
            <div className="mt-1 flex items-center gap-1 text-xs sm:text-sm text-red-600">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-expanded={showAdvanced}
            aria-controls="advanced-options"
          >
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Advanced Options
          </button>

          {showAdvanced && (
            <div
              id="advanced-options"
              className="mt-3 p-4 bg-gray-900 rounded-md"
            >
              <label
                htmlFor="api-token"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                GitHub API Token (Optional)
              </label>
              <input
                id="api-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-gray-700 rounded-md bg-gray-800 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={disabled}
              />
              <p className="mt-2 text-xs text-gray-400">
                Adding a token increases rate limits from 60 to 5,000 requests
                per hour. Your token is not stored.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled || !url}
          className={cn(
            'w-full py-2 px-4 rounded-md font-medium transition-colors',
            disabled || !url
              ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600',
          )}
        >
          {disabled ? 'Processing...' : 'Analyze Repository'}
        </button>
      </form>
    </div>
  );
}
