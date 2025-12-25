/**
 * Property-based tests for ViewManager
 * **Feature: office-attendance-tracker, Property 8: Year view completeness**
 * **Validates: Requirements 3.1**
 * 
 * **Feature: office-attendance-tracker, Property 12: Navigation consistency**
 * **Validates: Requirements 3.6**
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { ViewManager } from '../ViewManager';
import { AttendanceTracker } from '../AttendanceTracker';
import { CalendarEngine } from '../CalendarEngine';
import { ConfigurationManager } from '../ConfigurationManager';
import { StorageManager } from '../StorageManager';

describe('ViewManager Property Tests', () => {
  let viewManager: ViewManager;
  let attendanceTracker: AttendanceTracker;
  let calendarEngine: CalendarEngine;
  let configurationManager: ConfigurationManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    // Create fresh instances for each test
    calendarEngine = new CalendarEngine();
    configurationManager = new ConfigurationManager();
    storageManager = new StorageManager();
    attendanceTracker = new AttendanceTracker(calendarEngine, configurationManager, storageManager);
    viewManager = new ViewManager(attendanceTracker, calendarEngine, configurationManager);
  });

  /**
   * **Feature: office-attendance-tracker, Property 8: Year view completeness**
   * **Validates: Requirements 3.1**
   * 
   * For any selected year, the system should display all 12 months of that year with summary information
   */
  test('Property 8: Year view completeness - year summary contains all 12 months', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }), // Valid year range
        (year) => {
          const yearSummary = viewManager.getYearSummary(year);

          // Should have exactly 12 month summaries
          expect(yearSummary.monthSummaries).toHaveLength(12);
          expect(yearSummary.year).toBe(year);

          // Each month should be represented exactly once
          const months = yearSummary.monthSummaries.map(summary => summary.month);
          expect(months.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

          // Each month summary should have required properties
          yearSummary.monthSummaries.forEach((monthSummary, index) => {
            expect(monthSummary.month).toBe(index + 1);
            expect(monthSummary.monthName).toBeDefined();
            expect(typeof monthSummary.monthName).toBe('string');
            expect(monthSummary.monthName.length).toBeGreaterThan(0);
            expect(typeof monthSummary.requiredDays).toBe('number');
            expect(typeof monthSummary.completedDays).toBe('number');
            expect(typeof monthSummary.annualLeaveDays).toBe('number');
            expect(typeof monthSummary.isOnTrack).toBe('boolean');
            expect(monthSummary.requiredDays).toBeGreaterThanOrEqual(0);
            expect(monthSummary.completedDays).toBeGreaterThanOrEqual(0);
            expect(monthSummary.annualLeaveDays).toBeGreaterThanOrEqual(0);
          });

          // Year summary should have valid totals
          expect(typeof yearSummary.totalRequiredDays).toBe('number');
          expect(typeof yearSummary.totalCompletedDays).toBe('number');
          expect(typeof yearSummary.overallProgress).toBe('number');
          expect(yearSummary.totalRequiredDays).toBeGreaterThanOrEqual(0);
          expect(yearSummary.totalCompletedDays).toBeGreaterThanOrEqual(0);
          expect(yearSummary.overallProgress).toBeGreaterThanOrEqual(0);
          expect(yearSummary.overallProgress).toBeLessThanOrEqual(100);

          // Totals should be sum of monthly values
          const expectedTotalRequired = yearSummary.monthSummaries.reduce(
            (sum, month) => sum + month.requiredDays, 0
          );
          const expectedTotalCompleted = yearSummary.monthSummaries.reduce(
            (sum, month) => sum + month.completedDays, 0
          );

          expect(yearSummary.totalRequiredDays).toBe(expectedTotalRequired);
          expect(yearSummary.totalCompletedDays).toBe(expectedTotalCompleted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: office-attendance-tracker, Property 12: Navigation consistency**
   * **Validates: Requirements 3.6**
   * 
   * For any view navigation (year to month, month to month), the system should maintain 
   * consistent visual formatting and data display
   */
  test('Property 12: Navigation consistency - view state changes are consistent', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }), // Valid year range
        fc.integer({ min: 1, max: 12 }), // Valid month range
        fc.integer({ min: 2020, max: 2030 }), // Second year for navigation
        fc.integer({ min: 1, max: 12 }), // Second month for navigation
        (year1, month1, year2, month2) => {
          // Start with year view
          viewManager.showYearView(year1);
          let currentView = viewManager.getCurrentView();
          expect(currentView.currentView).toBe('year');
          expect(currentView.selectedYear).toBe(year1);
          expect(currentView.selectedMonth).toBeUndefined();

          // Navigate to month view
          viewManager.showMonthView(month1, year1);
          currentView = viewManager.getCurrentView();
          expect(currentView.currentView).toBe('month');
          expect(currentView.selectedYear).toBe(year1);
          expect(currentView.selectedMonth).toBe(month1);

          // Navigate to different month
          viewManager.showMonthView(month2, year2);
          currentView = viewManager.getCurrentView();
          expect(currentView.currentView).toBe('month');
          expect(currentView.selectedYear).toBe(year2);
          expect(currentView.selectedMonth).toBe(month2);

          // Navigate back to year view
          viewManager.showYearView(year2);
          currentView = viewManager.getCurrentView();
          expect(currentView.currentView).toBe('year');
          expect(currentView.selectedYear).toBe(year2);
          expect(currentView.selectedMonth).toBeUndefined();

          // Year summary should be consistent regardless of navigation path
          const yearSummary1 = viewManager.getYearSummary(year1);
          const yearSummary2 = viewManager.getYearSummary(year1); // Same year, should be identical
          expect(yearSummary1).toEqual(yearSummary2);

          // View state should always reflect the last navigation action
          expect(currentView.selectedYear).toBe(year2);
          expect(currentView.currentView).toBe('year');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 12: Navigation consistency - view change listeners are notified correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }), // Valid year range
        fc.integer({ min: 1, max: 12 }), // Valid month range
        (year, month) => {
          let notificationCount = 0;
          let lastNotifiedState: any = null;

          const listener = (viewState: unknown) => {
            notificationCount++;
            lastNotifiedState = viewState;
          };

          viewManager.addViewChangeListener(listener);

          // Initial state should not trigger notification
          const initialCount = notificationCount;

          // Navigate to year view (should trigger notification if different)
          viewManager.showYearView(year);
          const afterYearCount = notificationCount;

          // Navigate to month view (should trigger notification)
          viewManager.showMonthView(month, year);
          const afterMonthCount = notificationCount;

          // Navigate to same month view (should not trigger notification)
          viewManager.showMonthView(month, year);
          const afterSameMonthCount = notificationCount;

          // Verify notifications were sent appropriately
          expect(afterMonthCount).toBeGreaterThan(afterYearCount);
          expect(afterSameMonthCount).toBe(afterMonthCount); // No change, no notification

          // Last notified state should match current view
          const currentView = viewManager.getCurrentView();
          expect(lastNotifiedState).toEqual(currentView);

          // Clean up listener
          viewManager.removeViewChangeListener(listener);
        }
      ),
      { numRuns: 100 }
    );
  });
});