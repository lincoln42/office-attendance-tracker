import { describe, it, expect, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { AttendanceTracker } from '../AttendanceTracker';
import { CalendarEngine } from '../CalendarEngine';
import { ConfigurationManager } from '../ConfigurationManager';
import { StorageManager } from '../StorageManager';
import type { StorageManager as IStorageManager } from '../../types';

// Mock storage manager for isolated testing
class MockStorageManager implements IStorageManager {
  private storage: Map<string, unknown> = new Map();

  save(key: string, data: unknown): void {
    this.storage.set(key, JSON.parse(JSON.stringify(data))); // Deep clone
  }

  load<T>(key: string): T | null {
    const data = this.storage.get(key);
    return data ? JSON.parse(JSON.stringify(data)) : null; // Deep clone
  }

  isAvailable(): boolean {
    return true;
  }

  clear(): void {
    this.storage.clear();
  }
}

describe('AttendanceTracker Property Tests', () => {
  let attendanceTracker: AttendanceTracker;
  let calendarEngine: CalendarEngine;
  let configurationManager: ConfigurationManager;
  let storageManager: StorageManager;

  beforeEach(() => {
    calendarEngine = new CalendarEngine();
    configurationManager = new ConfigurationManager();
    storageManager = new StorageManager();
    attendanceTracker = new AttendanceTracker(calendarEngine, configurationManager, storageManager);

    // Clear storage before each test
    storageManager.clear();
  });

  /**
   * **Feature: office-attendance-tracker, Property 6: Annual leave validation**
   * **Validates: Requirements 2.1**
   */
  it('should accept annual leave values between 0 and working days in month and reject invalid values', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 12 }), // month
      fc.integer({ min: 2020, max: 2030 }), // year
      fc.oneof(
        fc.constant('UK'),
        fc.constant('US'),
        fc.constant('Mexico')
      ), // location
      fc.integer({ min: -10, max: 50 }), // days (including invalid values)
      (month, year, location, days) => {
        // Set up configuration
        configurationManager.setLocation(location);
        configurationManager.setYear(year);

        // Get the actual working days for this month
        const monthData = calendarEngine.getMonthData(month, year, location);
        const maxWorkingDays = monthData.workingDays.length;

        if (days >= 0 && days <= maxWorkingDays && Number.isInteger(days)) {
          // Valid input - should succeed
          expect(() => {
            attendanceTracker.setAnnualLeave(month, year, days);
          }).not.toThrow();

          // Verify the value was set correctly
          expect(attendanceTracker.getAnnualLeave(month, year)).toBe(days);
        } else {
          // Invalid input - should throw error
          expect(() => {
            attendanceTracker.setAnnualLeave(month, year, days);
          }).toThrow();
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Feature: office-attendance-tracker, Property 7: Reactive system updates**
   * **Validates: Requirements 2.2, 2.3, 4.3, 5.5**
   */
  it('should immediately recalculate and update all affected displays when data changes', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 12 }), // month
      fc.integer({ min: 2020, max: 2030 }), // year
      fc.oneof(
        fc.constant('UK'),
        fc.constant('US'),
        fc.constant('Mexico')
      ), // location
      fc.integer({ min: 0, max: 100 }), // percentage
      fc.integer({ min: 0, max: 10 }), // annual leave days
      (month, year, location, percentage, annualLeaveDays) => {
        // Create fresh instances for this property test run with isolated storage
        const testCalendarEngine = new CalendarEngine();
        const testConfigurationManager = new ConfigurationManager();
        const testStorageManager = new MockStorageManager();
        const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);

        // Set up initial configuration
        testConfigurationManager.setLocation(location);
        testConfigurationManager.setYear(year);
        testConfigurationManager.setInOfficePercentage(percentage);

        // Get working days to ensure annual leave is valid
        const monthData = testCalendarEngine.getMonthData(month, year, location);
        const maxWorkingDays = monthData.workingDays.length;
        const validAnnualLeave = Math.min(annualLeaveDays, maxWorkingDays);

        // Change annual leave and verify immediate update
        testAttendanceTracker.setAnnualLeave(month, year, validAnnualLeave);
        const statusAfterLeave = testAttendanceTracker.getAttendanceStatus(month, year);

        // Verify that the status reflects the annual leave change
        expect(statusAfterLeave.annualLeaveDays).toBe(validAnnualLeave);

        // Change configuration and verify immediate update
        const newPercentage = Math.min(100, percentage + 10);
        testConfigurationManager.setInOfficePercentage(newPercentage);
        const statusAfterConfig = testAttendanceTracker.getAttendanceStatus(month, year);

        // Verify that required days calculation updated with new percentage
        const expectedRequiredDays = Math.ceil(
          (Math.max(0, maxWorkingDays - validAnnualLeave) * newPercentage) / 100
        );
        expect(statusAfterConfig.requiredDays).toBe(expectedRequiredDays);

        // Mark attendance and verify immediate update
        if (monthData.workingDays.length > 0) {
          const workingDay = monthData.workingDays[0];
          testAttendanceTracker.markOfficeDay(workingDay);
          const statusAfterAttendance = testAttendanceTracker.getAttendanceStatus(month, year);

          // Verify that completed days increased
          expect(statusAfterAttendance.completedDays).toBe(1);
          expect(statusAfterAttendance.remainingDays).toBe(
            Math.max(0, expectedRequiredDays - 1)
          );
        }
      }
    ), { numRuns: 100 });
  });

  /**
   * **Feature: office-attendance-tracker, Property 13: Attendance toggle functionality**
   * **Validates: Requirements 4.1**
   */
  it('should toggle office attendance status when clicking on working days', () => {
    fc.assert(fc.property(
      fc.integer({ min: 1, max: 12 }), // month
      fc.integer({ min: 2020, max: 2030 }), // year
      fc.oneof(
        fc.constant('UK'),
        fc.constant('US'),
        fc.constant('Mexico')
      ), // location
      (month, year, location) => {
        // Create fresh instances for this property test run
        const testCalendarEngine = new CalendarEngine();
        const testConfigurationManager = new ConfigurationManager();
        const testStorageManager = new MockStorageManager();
        const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);



        // Set up configuration
        testConfigurationManager.setLocation(location);
        testConfigurationManager.setYear(year);

        // Get working days for this month
        const monthData = testCalendarEngine.getMonthData(month, year, location);

        if (monthData.workingDays.length > 0) {
          const workingDay = monthData.workingDays[0];

          // Initially should not be marked
          expect(testAttendanceTracker.isOfficeDay(workingDay)).toBe(false);

          // Mark the day
          testAttendanceTracker.markOfficeDay(workingDay);
          expect(testAttendanceTracker.isOfficeDay(workingDay)).toBe(true);

          // Unmark the day
          testAttendanceTracker.unmarkOfficeDay(workingDay);
          expect(testAttendanceTracker.isOfficeDay(workingDay)).toBe(false);

          // Mark again to verify toggle works multiple times
          testAttendanceTracker.markOfficeDay(workingDay);
          expect(testAttendanceTracker.isOfficeDay(workingDay)).toBe(true);
        }
      }
    ), { numRuns: 100 });
  });
});
/**
 * **Feature: office-attendance-tracker, Property 15: Required days calculation**
 * **Validates: Requirements 5.1, 5.4**
 */
it('should calculate required office days based on working days, percentage, and excluding annual leave', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1, max: 12 }), // month
    fc.integer({ min: 2020, max: 2030 }), // year
    fc.oneof(
      fc.constant('UK'),
      fc.constant('US'),
      fc.constant('Mexico')
    ), // location
    fc.integer({ min: 0, max: 100 }), // percentage
    fc.integer({ min: 0, max: 10 }), // annual leave days
    (month, year, location, percentage, annualLeaveDays) => {
      // Create fresh instances for this property test run with isolated storage
      const testCalendarEngine = new CalendarEngine();
      const testConfigurationManager = new ConfigurationManager();
      const testStorageManager = new MockStorageManager();
      const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);

      // Set up configuration
      testConfigurationManager.setLocation(location);
      testConfigurationManager.setYear(year);
      testConfigurationManager.setInOfficePercentage(percentage);

      // Get working days for this month
      const monthData = testCalendarEngine.getMonthData(month, year, location);
      const maxWorkingDays = monthData.workingDays.length;
      const validAnnualLeave = Math.min(annualLeaveDays, maxWorkingDays);

      // Set annual leave
      testAttendanceTracker.setAnnualLeave(month, year, validAnnualLeave);

      // Calculate expected required days
      const workingDaysAfterLeave = Math.max(0, maxWorkingDays - validAnnualLeave);
      const expectedRequiredDays = Math.ceil((workingDaysAfterLeave * percentage) / 100);

      // Test the calculation
      const actualRequiredDays = testAttendanceTracker.calculateRequiredDays(month, year);
      expect(actualRequiredDays).toBe(expectedRequiredDays);

      // Also verify through attendance status
      const status = testAttendanceTracker.getAttendanceStatus(month, year);
      expect(status.requiredDays).toBe(expectedRequiredDays);
      expect(status.annualLeaveDays).toBe(validAnnualLeave);
    }
  ), { numRuns: 100 });
});
/**
 * **Feature: office-attendance-tracker, Property 15a: Required days rounding**
 * **Validates: Requirements 5.2**
 */
it('should always round up fractional required office days to next whole number', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1, max: 12 }), // month
    fc.integer({ min: 2020, max: 2030 }), // year
    fc.oneof(
      fc.constant('UK'),
      fc.constant('US'),
      fc.constant('Mexico')
    ), // location
    fc.integer({ min: 1, max: 99 }), // percentage (avoid 0 and 100 to ensure fractional results)
    (month, year, location, percentage) => {
      // Create fresh instances for this property test run with isolated storage
      const testCalendarEngine = new CalendarEngine();
      const testConfigurationManager = new ConfigurationManager();
      const testStorageManager = new MockStorageManager();
      const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);

      // Set up configuration
      testConfigurationManager.setLocation(location);
      testConfigurationManager.setYear(year);
      testConfigurationManager.setInOfficePercentage(percentage);

      // Get working days for this month
      const monthData = testCalendarEngine.getMonthData(month, year, location);
      const workingDays = monthData.workingDays.length;

      // Skip if no working days
      if (workingDays === 0) return;

      // Calculate the exact fractional result
      const exactRequiredDays = (workingDays * percentage) / 100;
      const expectedRoundedUp = Math.ceil(exactRequiredDays);

      // Test the calculation
      const actualRequiredDays = testAttendanceTracker.calculateRequiredDays(month, year);

      // Should always be a whole number
      expect(Number.isInteger(actualRequiredDays)).toBe(true);

      // Should be the ceiling of the exact calculation
      expect(actualRequiredDays).toBe(expectedRoundedUp);

      // Should never be less than the exact calculation
      expect(actualRequiredDays).toBeGreaterThanOrEqual(exactRequiredDays);

      // Should never be more than 1 greater than the exact calculation
      expect(actualRequiredDays).toBeLessThan(exactRequiredDays + 1);
    }
  ), { numRuns: 100 });
});
/**
 * **Feature: office-attendance-tracker, Property 16: Progress tracking accuracy**
 * **Validates: Requirements 5.3**
 */
it('should accurately show current office days completed versus required days', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1, max: 12 }), // month
    fc.integer({ min: 2020, max: 2030 }), // year
    fc.oneof(
      fc.constant('UK'),
      fc.constant('US'),
      fc.constant('Mexico')
    ), // location
    fc.integer({ min: 10, max: 100 }), // percentage
    fc.integer({ min: 0, max: 5 }), // annual leave days
    fc.integer({ min: 0, max: 10 }), // number of days to mark as office days
    (month, year, location, percentage, annualLeaveDays, daysToMark) => {
      // Create fresh instances for this property test run with isolated storage
      const testCalendarEngine = new CalendarEngine();
      const testConfigurationManager = new ConfigurationManager();
      const testStorageManager = new MockStorageManager();
      const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);

      // Set up configuration
      testConfigurationManager.setLocation(location);
      testConfigurationManager.setYear(year);
      testConfigurationManager.setInOfficePercentage(percentage);

      // Get working days for this month
      const monthData = testCalendarEngine.getMonthData(month, year, location);
      const maxWorkingDays = monthData.workingDays.length;

      // Skip if no working days
      if (maxWorkingDays === 0) return;

      const validAnnualLeave = Math.min(annualLeaveDays, maxWorkingDays);
      const validDaysToMark = Math.min(daysToMark, maxWorkingDays);

      // Set annual leave
      testAttendanceTracker.setAnnualLeave(month, year, validAnnualLeave);

      // Mark some office days
      for (let i = 0; i < validDaysToMark && i < monthData.workingDays.length; i++) {
        testAttendanceTracker.markOfficeDay(monthData.workingDays[i]);
      }

      // Get attendance status
      const status = testAttendanceTracker.getAttendanceStatus(month, year);

      // Verify completed days matches what we marked
      expect(status.completedDays).toBe(validDaysToMark);

      // Verify required days calculation
      const workingDaysAfterLeave = Math.max(0, maxWorkingDays - validAnnualLeave);
      const expectedRequiredDays = Math.ceil((workingDaysAfterLeave * percentage) / 100);
      expect(status.requiredDays).toBe(expectedRequiredDays);

      // Verify remaining days calculation
      const expectedRemainingDays = Math.max(0, expectedRequiredDays - validDaysToMark);
      expect(status.remainingDays).toBe(expectedRemainingDays);

      // Verify annual leave is tracked correctly
      expect(status.annualLeaveDays).toBe(validAnnualLeave);

      // Verify on-track status
      const expectedOnTrack = validDaysToMark >= expectedRequiredDays;
      expect(status.isOnTrack).toBe(expectedOnTrack);
    }
  ), { numRuns: 100 });
});
/**
 * **Feature: office-attendance-tracker, Property 17: Progress status indication**
 * **Validates: Requirements 5.5**
 */
it('should correctly indicate whether employee is meeting, exceeding, or falling short of requirements', () => {
  fc.assert(fc.property(
    fc.integer({ min: 1, max: 12 }), // month
    fc.integer({ min: 2020, max: 2030 }), // year
    fc.oneof(
      fc.constant('UK'),
      fc.constant('US'),
      fc.constant('Mexico')
    ), // location
    fc.integer({ min: 10, max: 100 }), // percentage
    fc.integer({ min: 0, max: 3 }), // annual leave days
    (month, year, location, percentage, annualLeaveDays) => {
      // Create fresh instances for this property test run with isolated storage
      const testCalendarEngine = new CalendarEngine();
      const testConfigurationManager = new ConfigurationManager();
      const testStorageManager = new MockStorageManager();
      const testAttendanceTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, testStorageManager);

      // Set up configuration
      testConfigurationManager.setLocation(location);
      testConfigurationManager.setYear(year);
      testConfigurationManager.setInOfficePercentage(percentage);

      // Get working days for this month
      const monthData = testCalendarEngine.getMonthData(month, year, location);
      const maxWorkingDays = monthData.workingDays.length;

      // Skip if no working days
      if (maxWorkingDays === 0) return;

      const validAnnualLeave = Math.min(annualLeaveDays, maxWorkingDays);

      // Set annual leave
      testAttendanceTracker.setAnnualLeave(month, year, validAnnualLeave);

      // Calculate required days
      const workingDaysAfterLeave = Math.max(0, maxWorkingDays - validAnnualLeave);
      const requiredDays = Math.ceil((workingDaysAfterLeave * percentage) / 100);

      // Test scenario 1: No office days marked (falling short)
      let status = testAttendanceTracker.getAttendanceStatus(month, year);
      if (requiredDays > 0) {
        expect(status.isOnTrack).toBe(false); // Should be falling short
      } else {
        expect(status.isOnTrack).toBe(true); // No days required, so on track
      }

      // Test scenario 2: Mark exactly required days (meeting requirements)
      if (requiredDays > 0 && monthData.workingDays.length >= requiredDays) {
        for (let i = 0; i < requiredDays; i++) {
          testAttendanceTracker.markOfficeDay(monthData.workingDays[i]);
        }
        status = testAttendanceTracker.getAttendanceStatus(month, year);
        expect(status.isOnTrack).toBe(true); // Should be meeting requirements
        expect(status.completedDays).toBe(requiredDays);
        expect(status.remainingDays).toBe(0);
      }

      // Test scenario 3: Mark more than required days (exceeding requirements)
      if (requiredDays > 0 && monthData.workingDays.length > requiredDays) {
        // Clear previous markings by creating fresh tracker
        const freshTracker = new AttendanceTracker(testCalendarEngine, testConfigurationManager, new MockStorageManager());
        freshTracker.setAnnualLeave(month, year, validAnnualLeave);

        const extraDays = Math.min(requiredDays + 1, monthData.workingDays.length);
        for (let i = 0; i < extraDays; i++) {
          freshTracker.markOfficeDay(monthData.workingDays[i]);
        }
        status = freshTracker.getAttendanceStatus(month, year);
        expect(status.isOnTrack).toBe(true); // Should be exceeding requirements
        expect(status.completedDays).toBe(extraDays);
        expect(status.remainingDays).toBe(0);
      }
    }
  ), { numRuns: 100 });
});