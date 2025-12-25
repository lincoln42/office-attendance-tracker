import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { ConfigurationManager } from '../ConfigurationManager';
import { CalendarEngine } from '../CalendarEngine';

describe('ConfigurationManager Property Tests', () => {
  let configManager: ConfigurationManager;
  let calendarEngine: CalendarEngine;

  beforeEach(() => {
    configManager = new ConfigurationManager();
    calendarEngine = new CalendarEngine();
  });

  describe('Property 1: Location selection loads correct holidays', () => {
    it('should load appropriate holiday data for any supported location', () => {
      /**
       * Feature: office-attendance-tracker, Property 1: Location selection loads correct holidays
       * Validates: Requirements 1.2
       */

      const supportedLocations = configManager.getSupportedLocations();

      fc.assert(fc.property(
        fc.constantFrom(...supportedLocations),
        fc.integer({ min: 2024, max: 2025 }), // Test years with known holiday data
        fc.integer({ min: 1, max: 12 }), // Test all months
        (location, year, month) => {
          // Set the location in configuration
          configManager.setLocation(location);
          const config = configManager.getConfiguration();

          // Verify the location was set correctly
          expect(config.location).toBe(location);

          // Get holidays for this location, year, and month
          const holidays = calendarEngine.getPublicHolidays(month, year, location);

          // Holidays should be an array (could be empty for months with no holidays)
          expect(Array.isArray(holidays)).toBe(true);

          // All holidays should be valid dates in the correct month and year
          holidays.forEach(holiday => {
            expect(holiday).toBeInstanceOf(Date);
            expect(holiday.getFullYear()).toBe(year);
            expect(holiday.getMonth()).toBe(month - 1); // JavaScript months are 0-indexed
          });

          // Different locations should potentially have different holidays
          // (This is implicitly tested by the calendar engine having location-specific data)
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should reject unsupported locations', () => {
      fc.assert(fc.property(
        fc.string().filter(str => !configManager.getSupportedLocations().includes(str) && str.length > 0),
        (invalidLocation) => {
          expect(() => {
            configManager.setLocation(invalidLocation);
          }).toThrow();

          return true;
        }
      ), { numRuns: 50 });
    });
  });

  describe('Property 2: Percentage validation', () => {
    it('should accept values between 0 and 100 percent and reject values outside this range', () => {
      /**
       * Feature: office-attendance-tracker, Property 2: Percentage validation
       * Validates: Requirements 1.3
       */

      fc.assert(fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (validPercentage) => {
          // Valid percentages should be accepted without throwing
          expect(() => {
            configManager.setInOfficePercentage(validPercentage);
          }).not.toThrow();

          // Verify the percentage was set correctly
          const config = configManager.getConfiguration();
          expect(config.inOfficePercentage).toBe(validPercentage);

          return true;
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid percentage values', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.001), noNaN: true }), // Negative values
          fc.float({ min: Math.fround(100.001), max: Math.fround(1000), noNaN: true }), // Values > 100
          fc.constant(NaN), // NaN
          fc.constant(Infinity), // Infinity
          fc.constant(-Infinity) // -Infinity
        ),
        (invalidPercentage) => {
          expect(() => {
            configManager.setInOfficePercentage(invalidPercentage);
          }).toThrow();

          return true;
        }
      ), { numRuns: 100 });
    });

    it('should handle boundary values correctly', () => {
      // Test exact boundary values
      expect(() => {
        configManager.setInOfficePercentage(0);
      }).not.toThrow();

      expect(() => {
        configManager.setInOfficePercentage(100);
      }).not.toThrow();

      // Verify boundary values are set correctly
      configManager.setInOfficePercentage(0);
      expect(configManager.getConfiguration().inOfficePercentage).toBe(0);

      configManager.setInOfficePercentage(100);
      expect(configManager.getConfiguration().inOfficePercentage).toBe(100);
    });
  });

  describe('Property 3: Year selection displays correct calendar', () => {
    it('should display accurate calendar data for any valid year selection', () => {
      /**
       * Feature: office-attendance-tracker, Property 3: Year selection displays correct calendar
       * Validates: Requirements 1.4
       */

      fc.assert(fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.constantFrom(...configManager.getSupportedLocations()),
        fc.integer({ min: 1, max: 12 }),
        (year, location, month) => {
          // Set the year in configuration
          configManager.setYear(year);
          const config = configManager.getConfiguration();

          // Verify the year was set correctly
          expect(config.year).toBe(year);

          // Get calendar data for this year, month, and location
          const monthData = calendarEngine.getMonthData(month, year, location);

          // Verify calendar data is accurate for the selected year
          expect(monthData).toBeDefined();
          expect(monthData.totalDays).toBeGreaterThan(0);
          expect(monthData.totalDays).toBeLessThanOrEqual(31);

          // Verify leap year detection is correct for the selected year
          const expectedLeapYear = calendarEngine.isLeapYear(year);
          expect(monthData.isLeapYear).toBe(expectedLeapYear);

          // For February, verify correct day count based on leap year
          if (month === 2) {
            if (expectedLeapYear) {
              expect(monthData.totalDays).toBe(29);
            } else {
              expect(monthData.totalDays).toBe(28);
            }
          }

          // Verify all dates in working days belong to the correct year and month
          monthData.workingDays.forEach(workingDay => {
            expect(workingDay.getFullYear()).toBe(year);
            expect(workingDay.getMonth()).toBe(month - 1); // JavaScript months are 0-indexed
          });

          // Verify all holidays belong to the correct year and month
          monthData.publicHolidays.forEach(holiday => {
            expect(holiday.getFullYear()).toBe(year);
            expect(holiday.getMonth()).toBe(month - 1);
          });

          return true;
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid year values', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: 1899 }), // Years before 1900
          fc.integer({ min: 2101, max: 3000 }), // Years after 2100
          fc.constant(NaN), // NaN
          fc.float({ min: Math.fround(2000.1), max: Math.fround(2000.9), noNaN: true }) // Non-integer values
        ),
        (invalidYear) => {
          expect(() => {
            configManager.setYear(invalidYear);
          }).toThrow();

          return true;
        }
      ), { numRuns: 50 });
    });

    it('should handle boundary year values correctly', () => {
      // Test boundary values
      expect(() => {
        configManager.setYear(1900);
      }).not.toThrow();

      expect(() => {
        configManager.setYear(2100);
      }).not.toThrow();

      // Verify boundary values are set correctly
      configManager.setYear(1900);
      expect(configManager.getConfiguration().year).toBe(1900);

      configManager.setYear(2100);
      expect(configManager.getConfiguration().year).toBe(2100);
    });
  });
});