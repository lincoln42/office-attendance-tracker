/**
 * Property-Based Test for Screen Reader Compatibility
 * Feature: office-attendance-tracker, Property 20: Screen reader compatibility
 * Validates: Accessibility Requirements
 */

import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { YearView, MonthCalendar, ConfigurationForm, AnnualLeaveInput, ProgressDisplay } from '../components';
import { ConfigurationManager } from '../services/ConfigurationManager';
import { CalendarEngine } from '../services/CalendarEngine';
import { AttendanceTracker } from '../services/AttendanceTracker';
import { StorageManager } from '../services/StorageManager';

describe('Property 20: Screen Reader Compatibility', () => {
  /**
   * Property test to verify that calendar days have proper ARIA labels
   * For any calendar day or form element, screen readers should be able to announce the element's purpose, state, and value
   */
  it('should provide ARIA labels for all calendar days', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          year: fc.integer({ min: 2020, max: 2030 }),
          month: fc.integer({ min: 1, max: 12 })
        }),
        async ({ year, month }) => {
          const { container } = render(<MonthCalendar month={month} year={year} />);

          // Find all calendar day elements
          const dayElements = container.querySelectorAll('[data-day]');

          // Verify that working days have proper accessibility attributes
          for (const dayElement of Array.from(dayElements)) {
            const htmlElement = dayElement as HTMLElement;
            const day = htmlElement.getAttribute('data-day');

            if (day) {
              // Check if element has role for interactive elements
              const role = htmlElement.getAttribute('role');
              const tabIndex = htmlElement.getAttribute('tabindex');

              // If it's a working day (interactive), it should have tabindex
              if (tabIndex === '0') {
                // Should have aria-label for screen readers
                const ariaLabel = htmlElement.getAttribute('aria-label');
                expect(ariaLabel).toBeTruthy();
                expect(ariaLabel).toContain(day);
              }
            }
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property test to verify that form elements have proper labels
   */
  it('should provide proper labels for all form elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          componentType: fc.constantFrom('config', 'annualLeave')
        }),
        async ({ componentType }) => {
          let container: HTMLElement;

          if (componentType === 'config') {
            const mockConfigManager = new ConfigurationManager();
            const result = render(<ConfigurationForm configurationManager={mockConfigManager} />);
            container = result.container;
          } else {
            const mockConfigManager = new ConfigurationManager();
            const mockCalendarEngine = new CalendarEngine();
            const mockStorageManager = new StorageManager();
            const mockAttendanceTracker = new AttendanceTracker(mockCalendarEngine, mockConfigManager, mockStorageManager);
            const result = render(
              <AnnualLeaveInput
                attendanceTracker={mockAttendanceTracker}
                calendarEngine={mockCalendarEngine}
                configurationManager={mockConfigManager}
              />
            );
            container = result.container;
          }

          // Find all form inputs
          const inputs = container.querySelectorAll('input, select, textarea');

          for (const input of Array.from(inputs)) {
            const htmlInput = input as HTMLInputElement;
            const id = htmlInput.getAttribute('id');

            if (id) {
              // Should have an associated label
              const label = container.querySelector(`label[for="${id}"]`);
              expect(label).toBeTruthy();

              // Or should have aria-label or aria-labelledby
              if (!label) {
                const ariaLabel = htmlInput.getAttribute('aria-label');
                const ariaLabelledBy = htmlInput.getAttribute('aria-labelledby');
                expect(ariaLabel || ariaLabelledBy).toBeTruthy();
              }
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property test to verify that progress indicators have proper ARIA attributes
   */
  it('should provide ARIA attributes for progress indicators', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          requiredDays: fc.integer({ min: 0, max: 30 }),
          completedDays: fc.integer({ min: 0, max: 30 }),
          annualLeaveDays: fc.integer({ min: 0, max: 10 })
        }),
        async ({ requiredDays, completedDays, annualLeaveDays }) => {
          const remainingDays = Math.max(0, requiredDays - completedDays);
          const isOnTrack = completedDays >= requiredDays;

          const mockStatus = {
            requiredDays,
            completedDays,
            remainingDays,
            isOnTrack,
            annualLeaveDays
          };

          const { container } = render(<ProgressDisplay status={mockStatus} />);

          // Find progress bar elements
          const progressBars = container.querySelectorAll('[role="progressbar"]');

          for (const progressBar of Array.from(progressBars)) {
            const htmlElement = progressBar as HTMLElement;

            // Should have aria-valuenow, aria-valuemin, aria-valuemax
            expect(htmlElement.getAttribute('aria-valuenow')).toBeTruthy();
            expect(htmlElement.getAttribute('aria-valuemin')).toBeTruthy();
            expect(htmlElement.getAttribute('aria-valuemax')).toBeTruthy();

            // Should have aria-label
            const ariaLabel = htmlElement.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
          }

          // Find status indicators
          const statusIndicators = container.querySelectorAll('[role="status"]');

          for (const statusIndicator of Array.from(statusIndicators)) {
            const htmlElement = statusIndicator as HTMLElement;

            // Should have aria-label
            const ariaLabel = htmlElement.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property test to verify that interactive elements have proper roles
   */
  it('should provide proper roles for interactive elements', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          year: fc.integer({ min: 2020, max: 2030 })
        }),
        async ({ year }) => {
          const mockYearSummary = {
            year,
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
            <YearView year={year} yearSummary={mockYearSummary} onMonthSelect={mockOnMonthSelect} />
          );

          // Find all clickable month cards
          const monthCards = container.querySelectorAll('.month-card');

          for (const monthCard of Array.from(monthCards)) {
            const htmlElement = monthCard as HTMLElement;

            // Should have role="button" for clickable elements
            const role = htmlElement.getAttribute('role');
            expect(role).toBe('button');

            // Should have tabindex for keyboard accessibility
            const tabIndex = htmlElement.getAttribute('tabindex');
            expect(tabIndex).toBeTruthy();

            // Should have aria-label
            const ariaLabel = htmlElement.getAttribute('aria-label');
            expect(ariaLabel).toBeTruthy();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property test to verify that error messages are properly associated with form fields
   */
  it('should associate error messages with form fields using aria-describedby', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          componentType: fc.constantFrom('config')
        }),
        async ({ componentType }) => {
          const mockConfigManager = new ConfigurationManager();
          const { container } = render(<ConfigurationForm configurationManager={mockConfigManager} />);

          // Find all inputs with error states
          const inputs = container.querySelectorAll('input, select');

          for (const input of Array.from(inputs)) {
            const htmlInput = input as HTMLInputElement;
            const ariaDescribedBy = htmlInput.getAttribute('aria-describedby');

            // If there's an aria-describedby, verify the referenced element exists
            if (ariaDescribedBy) {
              const describedByIds = ariaDescribedBy.split(' ');
              for (const id of describedByIds) {
                const describedElement = container.querySelector(`#${id}`);
                expect(describedElement).toBeTruthy();
              }
            }
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
