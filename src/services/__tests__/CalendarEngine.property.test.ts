import { CalendarEngine } from '../CalendarEngine';
import * as fc from 'fast-check';

describe('CalendarEngine Property Tests', () => {
  let calendarEngine: CalendarEngine;

  beforeEach(() => {
    calendarEngine = new CalendarEngine();
  });

  describe('Property 22: Leap year detection accuracy', () => {
    it('should correctly identify leap years using the standard algorithm', () => {
      /**
       * Feature: office-attendance-tracker, Property 22: Leap year detection accuracy
       * Validates: Requirements 7.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          (year) => {
            const result = calendarEngine.isLeapYear(year);
            const expected = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

            expect(result).toBe(expected);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 23: February leap year day count', () => {
    it('should have 29 days in February for leap years and 28 days for non-leap years', () => {
      /**
       * Feature: office-attendance-tracker, Property 23: February leap year day count
       * Validates: Requirements 7.1, 7.2
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 9999 }),
          (year) => {
            const februaryDays = calendarEngine.getDaysInMonth(2, year);
            const isLeap = calendarEngine.isLeapYear(year);

            if (isLeap) {
              expect(februaryDays).toBe(29);
            } else {
              expect(februaryDays).toBe(28);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 24: Leap year working day calculations', () => {
    it('should include February 29th in working day calculations when it falls on a weekday and is not a holiday', () => {
      /**
       * Feature: office-attendance-tracker, Property 24: Leap year working day calculations
       * Validates: Requirements 7.3
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1600, max: 2400 }).filter(year =>
            (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
          ),
          fc.constantFrom('UK', 'US', 'Mexico'),
          (leapYear, location) => {
            const feb29 = new Date(leapYear, 1, 29); // February 29th
            const dayOfWeek = feb29.getDay();

            // Only test if Feb 29th falls on a weekday
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              const workingDays = calendarEngine.getWorkingDays(2, leapYear);
              const isWorkingDay = calendarEngine.isWorkingDay(feb29, location);

              // Feb 29th should be included in working days if it's not a holiday
              const feb29InWorkingDays = workingDays.some(date =>
                date.getDate() === 29 &&
                date.getMonth() === 1 &&
                date.getFullYear() === leapYear
              );

              expect(feb29InWorkingDays).toBe(isWorkingDay);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 11: Working day calculation accuracy', () => {
    it('should exclude weekends and public holidays from working day calculations', () => {
      /**
       * Feature: office-attendance-tracker, Property 11: Working day calculation accuracy
       * Validates: Requirements 3.4
       */
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 2020, max: 2030 }),
          fc.constantFrom('UK', 'US', 'Mexico'),
          (month, year, location) => {
            const workingDays = calendarEngine.getWorkingDays(month, year);
            const monthData = calendarEngine.getMonthData(month, year, location);

            // All working days should be weekdays (not Saturday or Sunday)
            workingDays.forEach(date => {
              const dayOfWeek = date.getDay();
              expect(dayOfWeek).not.toBe(0); // Not Sunday
              expect(dayOfWeek).not.toBe(6); // Not Saturday
            });

            // Working days in month data should exclude holidays
            monthData.workingDays.forEach(date => {
              const isHoliday = monthData.publicHolidays.some(holiday =>
                holiday.getDate() === date.getDate() &&
                holiday.getMonth() === date.getMonth() &&
                holiday.getFullYear() === date.getFullYear()
              );
              expect(isHoliday).toBe(false);
            });

            // Verify that weekends are properly identified
            monthData.weekends.forEach(date => {
              const dayOfWeek = date.getDay();
              expect(dayOfWeek === 0 || dayOfWeek === 6).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});