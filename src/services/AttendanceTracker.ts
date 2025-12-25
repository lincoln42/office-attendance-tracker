import type {
  AttendanceTracker as IAttendanceTracker,
  AttendanceStatus,
  AttendanceData,
  AnnualLeaveData,
  CalendarEngine,
  ConfigurationManager,
  StorageManager
} from '../types';

export class AttendanceTracker implements IAttendanceTracker {
  private attendanceData: AttendanceData = {};
  private annualLeaveData: AnnualLeaveData = {};
  private changeListeners: Array<() => void> = [];

  private calendarEngine: CalendarEngine;
  private configurationManager: ConfigurationManager;
  private storageManager: StorageManager;

  constructor(
    calendarEngine: CalendarEngine,
    configurationManager: ConfigurationManager,
    storageManager: StorageManager
  ) {
    this.calendarEngine = calendarEngine;
    this.configurationManager = configurationManager;
    this.storageManager = storageManager;
    this.loadData();

    // Listen for configuration changes to trigger reactive updates
    this.configurationManager.addConfigurationChangeListener(() => {
      this.notifyChangeListeners();
    });
  }

  markOfficeDay(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    // Validate that this is a working day
    const config = this.configurationManager.getConfiguration();
    if (!this.calendarEngine.isWorkingDay(date, config.location)) {
      throw new Error('Cannot mark attendance for non-working days (weekends or holidays)');
    }

    // Initialize nested structure if needed
    if (!this.attendanceData[year]) {
      this.attendanceData[year] = {};
    }
    if (!this.attendanceData[year][month]) {
      this.attendanceData[year][month] = {};
    }

    this.attendanceData[year][month][day] = true;
    this.saveData();
    this.notifyChangeListeners();
  }

  unmarkOfficeDay(date: Date): void {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    if (this.attendanceData[year]?.[month]?.[day]) {
      delete this.attendanceData[year][month][day];

      // Clean up empty objects
      if (Object.keys(this.attendanceData[year][month]).length === 0) {
        delete this.attendanceData[year][month];
      }
      if (Object.keys(this.attendanceData[year]).length === 0) {
        delete this.attendanceData[year];
      }

      this.saveData();
      this.notifyChangeListeners();
    }
  }

  setAnnualLeave(month: number, year: number, days: number): void {
    // Validate input
    if (!Number.isInteger(days) || days < 0) {
      throw new Error('Annual leave days must be a non-negative integer');
    }

    // Get working days for the month to validate maximum
    const config = this.configurationManager.getConfiguration();
    const monthData = this.calendarEngine.getMonthData(month, year, config.location);
    const maxWorkingDays = monthData.workingDays.length;

    if (days > maxWorkingDays) {
      throw new Error(`Annual leave days (${days}) cannot exceed working days in month (${maxWorkingDays})`);
    }

    // Initialize nested structure if needed
    if (!this.annualLeaveData[year]) {
      this.annualLeaveData[year] = {};
    }

    if (days === 0) {
      // Remove entry if setting to 0
      delete this.annualLeaveData[year][month];
      if (Object.keys(this.annualLeaveData[year]).length === 0) {
        delete this.annualLeaveData[year];
      }
    } else {
      this.annualLeaveData[year][month] = days;
    }

    this.saveData();
    this.notifyChangeListeners();
  }

  getAnnualLeave(month: number, year: number): number {
    return this.annualLeaveData[year]?.[month] || 0;
  }

  getAttendanceStatus(month: number, year: number): AttendanceStatus {
    const config = this.configurationManager.getConfiguration();
    const monthData = this.calendarEngine.getMonthData(month, year, config.location);

    const annualLeaveDays = this.getAnnualLeave(month, year);
    const workingDaysAfterLeave = Math.max(0, monthData.workingDays.length - annualLeaveDays);
    const requiredDays = this.calculateRequiredDays(month, year);

    // Count completed office days
    const completedDays = this.getCompletedOfficeDays(month, year);

    const remainingDays = Math.max(0, requiredDays - completedDays);
    const isOnTrack = completedDays >= requiredDays;

    return {
      requiredDays,
      completedDays,
      remainingDays,
      isOnTrack,
      annualLeaveDays
    };
  }

  calculateRequiredDays(month: number, year: number): number {
    const config = this.configurationManager.getConfiguration();
    const monthData = this.calendarEngine.getMonthData(month, year, config.location);

    const annualLeaveDays = this.getAnnualLeave(month, year);
    const workingDaysAfterLeave = Math.max(0, monthData.workingDays.length - annualLeaveDays);

    const requiredDaysFloat = (workingDaysAfterLeave * config.inOfficePercentage) / 100;

    // Always round up to next whole number as per requirements
    return Math.ceil(requiredDaysFloat);
  }

  private getCompletedOfficeDays(month: number, year: number): number {
    const monthAttendance = this.attendanceData[year]?.[month];
    if (!monthAttendance) {
      return 0;
    }

    return Object.values(monthAttendance).filter(Boolean).length;
  }

  private loadData(): void {
    try {
      const savedAttendanceData = this.storageManager.load<AttendanceData>('attendanceData');
      if (savedAttendanceData) {
        this.attendanceData = savedAttendanceData;
      }

      const savedAnnualLeaveData = this.storageManager.load<AnnualLeaveData>('annualLeaveData');
      if (savedAnnualLeaveData) {
        this.annualLeaveData = savedAnnualLeaveData;
      }
    } catch (error) {
      console.error('Failed to load attendance data:', error);
      // Continue with empty data if loading fails
    }
  }

  private saveData(): void {
    try {
      this.storageManager.save('attendanceData', this.attendanceData);
      this.storageManager.save('annualLeaveData', this.annualLeaveData);
    } catch (error) {
      console.error('Failed to save attendance data:', error);
      // Don't throw - allow operation to continue even if save fails
    }
  }

  private notifyChangeListeners(): void {
    this.changeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in attendance change listener:', error);
      }
    });
  }

  /**
   * Add a listener for attendance data changes
   */
  addChangeListener(listener: () => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a change listener
   */
  removeChangeListener(listener: () => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Check if a specific date is marked as an office day
   */
  isOfficeDay(date: Date): boolean {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    return Boolean(this.attendanceData[year]?.[month]?.[day]);
  }

  /**
   * Get all marked office days for a specific month
   */
  getOfficeDays(month: number, year: number): Date[] {
    const monthAttendance = this.attendanceData[year]?.[month];
    if (!monthAttendance) {
      return [];
    }

    const officeDays: Date[] = [];
    for (const [dayStr, isMarked] of Object.entries(monthAttendance)) {
      if (isMarked) {
        const day = parseInt(dayStr, 10);
        officeDays.push(new Date(year, month - 1, day));
      }
    }

    return officeDays.sort((a, b) => a.getTime() - b.getTime());
  }
}