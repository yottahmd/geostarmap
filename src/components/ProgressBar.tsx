import { X } from 'lucide-react';
import type { ProcessingProgress } from '../types';

interface ProgressBarProps {
  progress: ProcessingProgress;
  onCancel?: () => void;
}

export function ProgressBar({ progress, onCancel }: ProgressBarProps) {
  const percentage =
    progress.total > 0
      ? Math.round((progress.current / progress.total) * 100)
      : 0;

  if (progress.status === 'idle') {
    return null;
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-300">{progress.message}</p>
        {onCancel &&
          progress.status !== 'complete' &&
          progress.status !== 'error' && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-700"
              aria-label="Cancel operation"
              title="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
      </div>

      {progress.status !== 'error' && (
        <>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-500 h-2 transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {progress.current} / {progress.total} ({percentage}%)
          </p>
        </>
      )}

      {progress.status === 'error' && (
        <p className="text-sm text-red-600 mt-1">
          An error occurred. Please try again.
        </p>
      )}
    </div>
  );
}
