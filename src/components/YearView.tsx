import React from 'react';
import type { YearSummary, MonthSummary } from '../types';
import './YearView.css';

interface YearViewProps {
  year: number;
  yearSummary: YearSummary;
  onMonthSelect: (month: number, year: number) => void;
}

export const YearView: React.FC<YearViewProps> = ({ year, yearSummary, onMonthSelect }) => {
  const handleMonthClick = (month: number) => {
    onMonthSelect(month, year);
  };

  const getProgressBarColor = (monthSummary: MonthSummary): string => {
    if (monthSummary.requiredDays === 0) return '#e0e0e0';
    if (monthSummary.isOnTrack) return '#4caf50';
    if (monthSummary.completedDays > monthSummary.requiredDays) return '#2196f3';
    return '#ff9800';
  };

  const getStatusText = (monthSummary: MonthSummary): string => {
    if (monthSummary.requiredDays === 0) return 'No requirements';
    if (monthSummary.isOnTrack) return 'On track';
    if (monthSummary.completedDays > monthSummary.requiredDays) return 'Ahead';
    return 'Behind';
  };

  const getProgressPercentage = (monthSummary: MonthSummary): number => {
    if (monthSummary.requiredDays === 0) return 0;
    return Math.min(100, Math.round((monthSummary.completedDays / monthSummary.requiredDays) * 100));
  };

  return (
    <div className="year-view">
      <div className="year-header">
        <h1 className="year-title">Office Attendance - {year}</h1>
        <div className="year-summary">
          <div className="summary-item">
            <span className="summary-label">Total Required Days:</span>
            <span className="summary-value">{yearSummary.totalRequiredDays}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Completed Days:</span>
            <span className="summary-value">{yearSummary.totalCompletedDays}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Overall Progress:</span>
            <span className="summary-value">{yearSummary.overallProgress}%</span>
          </div>
        </div>
      </div>

      <div className="months-grid">
        {yearSummary.monthSummaries.map((monthSummary) => (
          <div
            key={monthSummary.month}
            className="month-card"
            onClick={() => handleMonthClick(monthSummary.month)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleMonthClick(monthSummary.month);
              }
            }}
            aria-label={`View details for ${monthSummary.monthName} ${year}`}
          >
            <div className="month-header">
              <h2 className="month-name">{monthSummary.monthName}</h2>
              <span
                className={`status-badge ${monthSummary.isOnTrack ? 'on-track' : 'off-track'}`}
                aria-label={`Status: ${getStatusText(monthSummary)}`}
              >
                {getStatusText(monthSummary)}
              </span>
            </div>

            <div className="month-stats">
              <div className="stat-row">
                <span className="stat-label">Required:</span>
                <span className="stat-value">{monthSummary.requiredDays} days</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Completed:</span>
                <span className="stat-value">{monthSummary.completedDays} days</span>
              </div>
              {monthSummary.annualLeaveDays > 0 && (
                <div className="stat-row">
                  <span className="stat-label">Annual Leave:</span>
                  <span className="stat-value">{monthSummary.annualLeaveDays} days</span>
                </div>
              )}
            </div>

            <div className="progress-container">
              <div
                className="progress-bar"
                role="progressbar"
                aria-valuenow={getProgressPercentage(monthSummary)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress: ${getProgressPercentage(monthSummary)}%`}
              >
                <div
                  className="progress-fill"
                  style={{
                    width: `${getProgressPercentage(monthSummary)}%`,
                    backgroundColor: getProgressBarColor(monthSummary)
                  }}
                />
              </div>
              <span className="progress-text">
                {getProgressPercentage(monthSummary)}%
              </span>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};