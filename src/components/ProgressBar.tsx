import React from 'react';
import { X } from 'lucide-react';
import { ProcessingProgress } from '../types';

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
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{progress.message}</p>
        {onCancel &&
          progress.status !== 'complete' &&
          progress.status !== 'error' && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
      </div>

      {progress.status !== 'error' && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
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
