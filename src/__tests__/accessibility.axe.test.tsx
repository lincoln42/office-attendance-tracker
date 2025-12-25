/**
 * Accessibility Tests with axe-core
 * Tests color contrast compliance, ARIA implementation, and keyboard navigation
 * Validates: Accessibility Requirements
 */

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { YearView, MonthCalendar, ConfigurationForm, AnnualLeaveInput, ProgressDisplay } from '../components';
import { ConfigurationManager } from '../services/ConfigurationManager';
import { CalendarEngine } from '../services/CalendarEngine';
import { AttendanceTracker } from '../services/AttendanceTracker';
import { StorageManager } from '../services/StorageManager';

// Jest matchers are extended in setupTests.ts

describe('Accessibility Tests with axe-core', () => {
  /**
   * Test color contrast compliance for all components
   */
  describe('Color Contrast Compliance', () => {
    it('should have no color contrast violations in YearView', async () => {
      const mockYearSummary = {
        year: 2024,
        monthSummaries: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][i],
          requiredDays: 20,
          completedDays: 15,
          annualLeaveDays: 2,
          isOnTrack: true
        })),
        totalRequiredDays: 240,
        totalCompletedDays: 180,
        overallProgress: 75
      };

      const mockOnMonthSelect = jest.fn();
      const { container } = render(
        <YearView year={2024} yearSummary={mockYearSummary} onMonthSelect={mockOnMonthSelect} />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have no color contrast violations in MonthCalendar', async () => {
      const { container } = render(<MonthCalendar month={1} year={2024} />);

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have no color contrast violations in ConfigurationForm', async () => {
      const mockConfigManager = new ConfigurationManager();
      const { container } = render(<ConfigurationForm configurationManager={mockConfigManager} />);

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have no color contrast violations in AnnualLeaveInput', async () => {
      const mockConfigManager = new ConfigurationManager();
      const mockCalendarEngine = new CalendarEngine();
      const mockStorageManager = new StorageManager();
      const mockAttendanceTracker = new AttendanceTracker(mockCalendarEngine, mockConfigManager, mockStorageManager);

      const { container } = render(
        <AnnualLeaveInput
          attendanceTracker={mockAttendanceTracker}
          calendarEngine={mockCalendarEngine}
          configurationManager={mockConfigManager}
        />
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have no color contrast violations in ProgressDisplay', async () => {
      const mockStatus = {
        requiredDays: 20,
        completedDays: 15,
        remainingDays: 5,
        isOnTrack: true,
        annualLeaveDays: 2
      };

      const { container } = render(<ProgressDisplay status={mockStatus} />);

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });
  });

  /**
   * Test ARIA implementation for all components
   */
  describe('ARIA Implementation', () => {
    it('should have proper ARIA implementation in YearView', async () => {
      const mockYearSummary = {
        year: 2024,
        monthSummaries: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][i],
          requiredDays: 20,
          completedDays: 15,
          annualLeaveDays: 2,
          isOnTrack: true
        })),
        totalRequiredDays: 240,
        totalCompletedDays: 180,
        overallProgress: 75
      };

      const mockOnMonthSelect = jest.fn();
      const { container } = render(
        <YearView year={2024} yearSummary={mockYearSummary} onMonthSelect={mockOnMonthSelect} />
      );

      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
          'button-name': { enabled: true },
          'aria-progressbar-name': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA implementation in MonthCalendar', async () => {
      const { container } = render(<MonthCalendar month={1} year={2024} />);

      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-roles': { enabled: true },
          'button-name': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA implementation in ConfigurationForm', async () => {
      const mockConfigManager = new ConfigurationManager();
      const { container } = render(<ConfigurationForm configurationManager={mockConfigManager} />);

      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'label': { enabled: true },
          'form-field-multiple-labels': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA implementation in ProgressDisplay', async () => {
      const mockStatus = {
        requiredDays: 20,
        completedDays: 15,
        remainingDays: 5,
        isOnTrack: true,
        annualLeaveDays: 2
      };

      const { container } = render(<ProgressDisplay status={mockStatus} />);

      const results = await axe(container, {
        rules: {
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
          'aria-progressbar-name': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });
  });

  /**
   * Test keyboard navigation accessibility
   */
  describe('Keyboard Navigation', () => {
    it('should have proper keyboard navigation in YearView', async () => {
      const mockYearSummary = {
        year: 2024,
        monthSummaries: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][i],
          requiredDays: 20,
          completedDays: 15,
          annualLeaveDays: 2,
          isOnTrack: true
        })),
        totalRequiredDays: 240,
        totalCompletedDays: 180,
        overallProgress: 75
      };

      const mockOnMonthSelect = jest.fn();
      const { container } = render(
        <YearView year={2024} yearSummary={mockYearSummary} onMonthSelect={mockOnMonthSelect} />
      );

      const results = await axe(container, {
        rules: {
          'tabindex': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper keyboard navigation in MonthCalendar', async () => {
      const { container } = render(<MonthCalendar month={1} year={2024} />);

      const results = await axe(container, {
        rules: {
          'tabindex': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });

    it('should have proper keyboard navigation in ConfigurationForm', async () => {
      const mockConfigManager = new ConfigurationManager();
      const { container } = render(<ConfigurationForm configurationManager={mockConfigManager} />);

      const results = await axe(container, {
        rules: {
          'tabindex': { enabled: true }
        }
      });

      expect(results).toHaveNoViolations();
    });
  });

  /**
   * Comprehensive accessibility test for all components
   */
  describe('Comprehensive Accessibility', () => {
    it('should pass all accessibility checks for YearView', async () => {
      const mockYearSummary = {
        year: 2024,
        monthSummaries: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          monthName: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'][i],
          requiredDays: 20,
          completedDays: 15,
          annualLeaveDays: 2,
          isOnTrack: true
        })),
        totalRequiredDays: 240,
        totalCompletedDays: 180,
        overallProgress: 75
      };

      const mockOnMonthSelect = jest.fn();
      const { container } = render(
        <YearView year={2024} yearSummary={mockYearSummary} onMonthSelect={mockOnMonthSelect} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass all accessibility checks for MonthCalendar', async () => {
      const { container } = render(<MonthCalendar month={1} year={2024} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass all accessibility checks for ConfigurationForm', async () => {
      const mockConfigManager = new ConfigurationManager();
      const { container } = render(<ConfigurationForm configurationManager={mockConfigManager} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass all accessibility checks for AnnualLeaveInput', async () => {
      const mockConfigManager = new ConfigurationManager();
      const mockCalendarEngine = new CalendarEngine();
      const mockStorageManager = new StorageManager();
      const mockAttendanceTracker = new AttendanceTracker(mockCalendarEngine, mockConfigManager, mockStorageManager);

      const { container } = render(
        <AnnualLeaveInput
          attendanceTracker={mockAttendanceTracker}
          calendarEngine={mockCalendarEngine}
          configurationManager={mockConfigManager}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass all accessibility checks for ProgressDisplay', async () => {
      const mockStatus = {
        requiredDays: 20,
        completedDays: 15,
        remainingDays: 5,
        isOnTrack: true,
        annualLeaveDays: 2
      };

      const { container } = render(<ProgressDisplay status={mockStatus} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});