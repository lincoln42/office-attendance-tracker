import React from 'react';
import type { AttendanceStatus } from '../types';
import './ProgressDisplay.css';

interface ProgressDisplayProps {
  status: AttendanceStatus;
  variant?: 'monthly' | 'yearly';
  showDetails?: boolean;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  status,
  variant = 'monthly',
  showDetails = true
}) => {
  const { requiredDays, completedDays, remainingDays, isOnTrack, annualLeaveDays } = status;

  // Calculate progress percentage
  const progressPercentage = requiredDays > 0
    ? Math.min(100, Math.round((completedDays / requiredDays) * 100))
    : 0;

  // Determine status indicator
  const getStatusIndicator = (): { text: string; className: string } => {
    if (requiredDays === 0) {
      return { text: 'No Requirements', className: 'status-none' };
    }
    if (completedDays > requiredDays) {
      return { text: 'Ahead', className: 'status-ahead' };
    }
    if (isOnTrack) {
      return { text: 'On Track', className: 'status-on-track' };
    }
    return { text: 'Behind', className: 'status-behind' };
  };

  const statusIndicator = getStatusIndicator();

  // Determine progress bar color
  const getProgressBarColor = (): string => {
    if (requiredDays === 0) return '#e0e0e0';
    if (completedDays > requiredDays) return '#2196f3'; // Blue for ahead
    if (isOnTrack) return '#4caf50'; // Green for on track
    return '#ff9800'; // Orange for behind
  };

  return (
    <div className={`progress-display progress-display-${variant}`}>
      {/* Status Badge */}
      <div className="progress-header">
        <span
          className={`status-indicator ${statusIndicator.className}`}
          role="status"
          aria-label={`Status: ${statusIndicator.text}`}
        >
          {statusIndicator.text}
        </span>
      </div>

      {/* Progress Stats */}
      {showDetails && (
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-label">Required Days:</span>
            <span className="stat-value" data-testid="required-days">
              {requiredDays}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Completed Days:</span>
            <span className="stat-value" data-testid="completed-days">
              {completedDays}
            </span>
          </div>
          {remainingDays > 0 && (
            <div className="stat-item">
              <span className="stat-label">Remaining Days:</span>
              <span className="stat-value" data-testid="remaining-days">
                {remainingDays}
              </span>
            </div>
          )}
          {annualLeaveDays > 0 && (
            <div className="stat-item">
              <span className="stat-label">Annual Leave:</span>
              <span className="stat-value" data-testid="annual-leave-days">
                {annualLeaveDays}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          role="progressbar"
          aria-valuenow={progressPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progress: ${progressPercentage}% complete`}
          data-testid="progress-bar"
        >
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: getProgressBarColor()
            }}
            data-testid="progress-bar-fill"
          />
        </div>
        <span className="progress-percentage" data-testid="progress-percentage">
          {progressPercentage}%
        </span>
      </div>
    </div>
  );
};
