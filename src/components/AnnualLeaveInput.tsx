import React, { useState, useEffect } from 'react';
import type { AttendanceTracker, CalendarEngine, ConfigurationManager } from '../types';
import './AnnualLeaveInput.css';

interface AnnualLeaveInputProps {
  attendanceTracker: AttendanceTracker;
  calendarEngine: CalendarEngine;
  configurationManager: ConfigurationManager;
  onLeaveChange?: () => void;
}

interface MonthLeaveData {
  month: number;
  monthName: string;
  workingDays: number;
  currentLeave: number;
  maxLeave: number;
}

interface FormErrors {
  [month: number]: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const AnnualLeaveInput: React.FC<AnnualLeaveInputProps> = ({
  attendanceTracker,
  calendarEngine,
  configurationManager,
  onLeaveChange
}) => {
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [configVersion, setConfigVersion] = useState(0);

  // Compute months data based on current configuration
  const monthsData = React.useMemo(() => {
    const config = configurationManager.getConfiguration();
    const { year, location } = config;

    const data: MonthLeaveData[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthData = calendarEngine.getMonthData(month, year, location);
      const currentLeave = attendanceTracker.getAnnualLeave(month, year);

      data.push({
        month,
        monthName: MONTH_NAMES[month - 1],
        workingDays: monthData.workingDays.length,
        currentLeave,
        maxLeave: monthData.workingDays.length
      });
    }

    return data;
  }, [configurationManager, calendarEngine, attendanceTracker, configVersion]);

  // Listen for configuration changes
  useEffect(() => {
    const handleConfigChange = () => {
      setConfigVersion(prev => prev + 1);
      setSaveMessage('');
    };

    configurationManager.addConfigurationChangeListener(handleConfigChange);
    return () => {
      configurationManager.removeConfigurationChangeListener(handleConfigChange);
    };
  }, [configurationManager]);

  const validateInput = (value: number, maxLeave: number): string | null => {
    if (!Number.isInteger(value)) {
      return 'Annual leave must be a whole number';
    }

    if (value < 0) {
      return 'Annual leave cannot be negative';
    }

    if (value > maxLeave) {
      return `Cannot exceed ${maxLeave} working days in this month`;
    }

    return null;
  };

  const handleLeaveChange = (month: number, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    const monthData = monthsData.find(m => m.month === month);

    if (!monthData) return;

    // Clear save message when form is modified
    if (saveMessage) {
      setSaveMessage('');
    }

    // Validate input
    const error = validateInput(numValue, monthData.maxLeave);

    if (error) {
      setErrors(prev => ({ ...prev, [month]: error }));
      return;
    }

    // Clear error for this month if validation passed
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[month];
      return newErrors;
    });

    try {
      const config = configurationManager.getConfiguration();
      attendanceTracker.setAnnualLeave(month, config.year, numValue);

      // Trigger re-computation of months data
      setConfigVersion(prev => prev + 1);

      // Notify parent component
      if (onLeaveChange) {
        onLeaveChange();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save annual leave';
      setErrors(prev => ({ ...prev, [month]: errorMessage }));
    }
  };

  const handleClearAll = () => {
    const config = configurationManager.getConfiguration();

    try {
      // Clear all annual leave for the year
      monthsData.forEach(({ month }) => {
        attendanceTracker.setAnnualLeave(month, config.year, 0);
      });

      // Trigger re-computation and clear state
      setConfigVersion(prev => prev + 1);
      setErrors({});
      setSaveMessage('All annual leave cleared');

      // Notify parent component
      if (onLeaveChange) {
        onLeaveChange();
      }
    } catch {
      setSaveMessage('Error clearing annual leave. Please try again.');
    }
  };

  const getTotalLeave = (): number => {
    return monthsData.reduce((sum, month) => sum + month.currentLeave, 0);
  };

  const getTotalWorkingDays = (): number => {
    return monthsData.reduce((sum, month) => sum + month.workingDays, 0);
  };

  return (
    <div className="annual-leave-input">
      <h2>Annual Leave</h2>

      <div className="leave-summary">
        <div className="summary-item">
          <span className="summary-label">Total Working Days:</span>
          <span className="summary-value">{getTotalWorkingDays()}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Annual Leave:</span>
          <span className="summary-value">{getTotalLeave()}</span>
        </div>
      </div>

      {saveMessage && (
        <div
          className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}
          role="alert"
        >
          {saveMessage}
        </div>
      )}

      <div className="months-grid">
        {monthsData.map(monthData => (
          <div key={monthData.month} className="month-leave-item">
            <label htmlFor={`leave-${monthData.month}`} className="month-label">
              {monthData.monthName}
            </label>

            <div className="leave-input-group">
              <input
                type="number"
                id={`leave-${monthData.month}`}
                min="0"
                max={monthData.maxLeave}
                step="1"
                value={monthData.currentLeave}
                onChange={(e) => handleLeaveChange(monthData.month, e.target.value)}
                className={errors[monthData.month] ? 'error' : ''}
                aria-describedby={
                  errors[monthData.month]
                    ? `leave-${monthData.month}-error`
                    : `leave-${monthData.month}-help`
                }
              />

              <span className="working-days-context">
                / {monthData.workingDays} working days
              </span>
            </div>

            {errors[monthData.month] && (
              <div
                id={`leave-${monthData.month}-error`}
                className="error-message"
                role="alert"
              >
                {errors[monthData.month]}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={handleClearAll}
          className="btn btn-secondary"
        >
          Clear All
        </button>
      </div>
    </div>
  );
};
