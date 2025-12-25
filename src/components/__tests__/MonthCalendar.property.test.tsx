import React from 'react';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { MonthCalendar } from '../MonthCalendar';
import { CalendarEngine } from '../../services/CalendarEngine';

describe('MonthCalendar Property Tests', () => {
  let calendarEngine: CalendarEngine;

  beforeEach(() => {
    calendarEngine = new CalendarEngine();
  });

  describe('Property 9: Calendar grid completeness', () => {
    it('should display a complete grid containing all days of the month', () => {
      /**
       * Feature: office-attendance-tracker, Property 9: Calendar grid completeness
       * Validates: Requirements 3.2
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2020, max: 2030 }),
          (month, year) => {
            const { container } = render(<MonthCalendar month={month} year={year} />);

            const expectedDaysInMonth = calendarEngine.getDaysInMonth(month, year);

            // Check that all days from 1 to expectedDaysInMonth are present in the rendered output
            for (let day = 1; day <= expectedDaysInMonth; day++) {
              const dayElement = container.querySelector(`[data-day="${day}"]`);
              expect(dayElement).toBeTruthy();
            }

            // Verify no extra days beyond the month are shown
            const extraDay = container.querySelector(`[data-day="${expectedDaysInMonth + 1}"]`);
            expect(extraDay).toBeFalsy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Holiday visual distinction', () => {
    it('should visually distinguish public holidays from regular working days', () => {
      /**
       * Feature: office-attendance-tracker, Property 10: Holiday visual distinction
       * Validates: Requirements 3.3
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2024, max: 2025 }), // Use years with known holiday data
          fc.constantFrom('UK', 'US', 'Mexico'),
          (month, year, location) => {
            const { container } = render(<MonthCalendar month={month} year={year} location={location} />);

            const holidays = calendarEngine.getPublicHolidays(month, year, location);

            holidays.forEach(holiday => {
              const day = holiday.getDate();
              const holidayElement = container.querySelector(`[data-day="${day}"]`);

              if (holidayElement) {
                // Holiday should have distinct visual styling (class or attribute)
                const hasHolidayClass = holidayElement.classList.contains('holiday') ||
                  holidayElement.classList.contains('public-holiday') ||
                  holidayElement.hasAttribute('data-holiday');

                expect(hasHolidayClass).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 14: Attendance visual feedback', () => {
    it('should display clear visual indication of in-office status for marked days', () => {
      /**
       * Feature: office-attendance-tracker, Property 14: Attendance visual feedback
       * Validates: Requirements 4.2
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2024, max: 2025 }),
          fc.constantFrom('UK', 'US', 'Mexico'),
          fc.array(fc.integer({ min: 1, max: 31 }), { minLength: 0, maxLength: 10 }),
          (month, year, location, markedDays) => {
            // Filter marked days to only include valid days for the month
            const daysInMonth = calendarEngine.getDaysInMonth(month, year);
            const validMarkedDays = markedDays.filter(day => day >= 1 && day <= daysInMonth);

            const { container } = render(
              <MonthCalendar
                month={month}
                year={year}
                location={location}
                markedOfficeDays={validMarkedDays}
              />
            );

            validMarkedDays.forEach(day => {
              const dayElement = container.querySelector(`[data-day="${day}"]`);

              if (dayElement) {
                // Marked office days should have distinct visual styling
                const hasAttendanceClass = dayElement.classList.contains('office-day') ||
                  dayElement.classList.contains('marked') ||
                  dayElement.classList.contains('attended') ||
                  dayElement.hasAttribute('data-office-day');

                expect(hasAttendanceClass).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});