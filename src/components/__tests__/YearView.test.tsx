import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { YearView } from '../YearView';
import type { YearSummary, MonthSummary } from '../../types';

describe('YearView Component Tests', () => {
  const mockOnMonthSelect = jest.fn();

  const createMockMonthSummary = (
    month: number,
    monthName: string,
    overrides: Partial<MonthSummary> = {}
  ): MonthSummary => ({
    month,
    monthName,
    requiredDays: 20,
    completedDays: 15,
    annualLeaveDays: 2,
    isOnTrack: true,
    ...overrides
  });

  const createMockYearSummary = (year: number, overrides: Partial<YearSummary> = {}): YearSummary => {
    const monthSummaries: MonthSummary[] = [
      createMockMonthSummary(1, 'January'),
      createMockMonthSummary(2, 'February'),
      createMockMonthSummary(3, 'March'),
      createMockMonthSummary(4, 'April'),
      createMockMonthSummary(5, 'May'),
      createMockMonthSummary(6, 'June'),
      createMockMonthSummary(7, 'July'),
      createMockMonthSummary(8, 'August'),
      createMockMonthSummary(9, 'September'),
      createMockMonthSummary(10, 'October'),
      createMockMonthSummary(11, 'November'),
      createMockMonthSummary(12, 'December')
    ];

    return {
      year,
      monthSummaries,
      totalRequiredDays: 240,
      totalCompletedDays: 180,
      overallProgress: 75,
      ...overrides
    };
  };

  beforeEach(() => {
    mockOnMonthSelect.mockClear();
  });

  describe('Year view rendering with mock data', () => {
    it('should render year title correctly', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('Office Attendance - 2024')).toBeTruthy();
    });

    it('should display year summary statistics', () => {
      const yearSummary = createMockYearSummary(2024, {
        totalRequiredDays: 250,
        totalCompletedDays: 200,
        overallProgress: 80
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('250')).toBeTruthy(); // Total Required Days
      expect(screen.getByText('200')).toBeTruthy(); // Total Completed Days
      expect(screen.getByText('80%')).toBeTruthy(); // Overall Progress
    });

    it('should render all 12 months', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      monthNames.forEach(monthName => {
        expect(screen.getByText(monthName)).toBeTruthy();
      });
    });

    it('should display month statistics correctly', () => {
      const yearSummary = createMockYearSummary(2024);
      // Modify January to have specific values for testing
      yearSummary.monthSummaries[0] = createMockMonthSummary(1, 'January', {
        requiredDays: 22,
        completedDays: 18,
        annualLeaveDays: 3
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      // Check that January's stats are displayed
      expect(screen.getByText('22 days')).toBeTruthy(); // Required days
      expect(screen.getByText('18 days')).toBeTruthy(); // Completed days
      expect(screen.getByText('3 days')).toBeTruthy(); // Annual leave days
    });

    it('should show correct status badges', () => {
      const yearSummary = createMockYearSummary(2024);
      // Set different statuses for testing
      yearSummary.monthSummaries[0] = createMockMonthSummary(1, 'January', {
        isOnTrack: true
      });
      yearSummary.monthSummaries[1] = createMockMonthSummary(2, 'February', {
        isOnTrack: false
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const onTrackBadges = screen.getAllByText('On track');
      const behindBadges = screen.getAllByText('Behind');

      expect(onTrackBadges.length).toBeGreaterThan(0);
      expect(behindBadges.length).toBeGreaterThan(0);
    });

    it('should not display annual leave when it is 0', () => {
      const yearSummary = createMockYearSummary(2024);
      // Set January to have no annual leave
      yearSummary.monthSummaries[0] = createMockMonthSummary(1, 'January', {
        annualLeaveDays: 0
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      // Should not show "Annual Leave:" for January
      const januaryCard = screen.getByText('January').closest('.month-card');
      expect(januaryCard?.textContent).not.toContain('Annual Leave:');
    });
  });

  describe('Month selection navigation', () => {
    it('should call onMonthSelect when month card is clicked', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const januaryCard = screen.getByText('January').closest('[role="button"]');
      fireEvent.click(januaryCard!);

      expect(mockOnMonthSelect).toHaveBeenCalledWith(1, 2024);
    });

    it('should call onMonthSelect when Enter key is pressed on month card', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const februaryCard = screen.getByText('February').closest('[role="button"]');
      fireEvent.keyDown(februaryCard!, { key: 'Enter' });

      expect(mockOnMonthSelect).toHaveBeenCalledWith(2, 2024);
    });

    it('should call onMonthSelect when Space key is pressed on month card', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const marchCard = screen.getByText('March').closest('[role="button"]');
      fireEvent.keyDown(marchCard!, { key: ' ' });

      expect(mockOnMonthSelect).toHaveBeenCalledWith(3, 2024);
    });

    it('should not call onMonthSelect for other keys', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const aprilCard = screen.getByText('April').closest('[role="button"]');
      fireEvent.keyDown(aprilCard!, { key: 'Tab' });

      expect(mockOnMonthSelect).not.toHaveBeenCalled();
    });

    it('should have proper accessibility attributes for navigation', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      const mayCard = screen.getByText('May').closest('[role="button"]');

      expect(mayCard?.getAttribute('tabIndex')).toBe('0');
      expect(mayCard?.getAttribute('aria-label')).toBe('View details for May 2024');
    });
  });

  describe('Responsive behavior', () => {
    it('should render without errors on different screen sizes', () => {
      const yearSummary = createMockYearSummary(2024);

      // Test mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const { rerender } = render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('Office Attendance - 2024')).toBeTruthy();

      // Test tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      rerender(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('Office Attendance - 2024')).toBeTruthy();

      // Test desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      rerender(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('Office Attendance - 2024')).toBeTruthy();
    });

    it('should maintain functionality across viewport changes', () => {
      const yearSummary = createMockYearSummary(2024);

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      // Simulate mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      // Month selection should still work
      const juneCard = screen.getByText('June').closest('[role="button"]');
      fireEvent.click(juneCard!);

      expect(mockOnMonthSelect).toHaveBeenCalledWith(6, 2024);
    });
  });

  describe('Progress indicators and status', () => {
    it('should display correct progress percentages', () => {
      const yearSummary = createMockYearSummary(2024);
      // Set July to have specific progress for testing
      yearSummary.monthSummaries[6] = createMockMonthSummary(7, 'July', {
        requiredDays: 20,
        completedDays: 16,
        isOnTrack: true
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      // July should show 80% progress (16/20 * 100)
      const progressBars = screen.getAllByRole('progressbar');
      const julyProgressBar = progressBars.find(bar =>
        bar.getAttribute('aria-valuenow') === '80'
      );

      expect(julyProgressBar).toBeTruthy();
    });

    it('should handle zero required days correctly', () => {
      const yearSummary = createMockYearSummary(2024);
      // Set August to have no required days
      yearSummary.monthSummaries[7] = createMockMonthSummary(8, 'August', {
        requiredDays: 0,
        completedDays: 0,
        isOnTrack: true
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      // Should show "No requirements" status
      expect(screen.getByText('No requirements')).toBeTruthy();
    });

    it('should show "Ahead" status when completed exceeds required', () => {
      const yearSummary = createMockYearSummary(2024);
      // Set September to be ahead
      yearSummary.monthSummaries[8] = createMockMonthSummary(9, 'September', {
        requiredDays: 18,
        completedDays: 22,
        isOnTrack: false // This would be false when ahead
      });

      render(
        <YearView
          year={2024}
          yearSummary={yearSummary}
          onMonthSelect={mockOnMonthSelect}
        />
      );

      expect(screen.getByText('Ahead')).toBeTruthy();
    });
  });
});