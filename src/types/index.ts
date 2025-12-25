// Core Configuration Types
export interface Configuration {
  location: string;
  year: number;
  inOfficePercentage: number;
}

// Calendar and Date Types
export interface MonthData {
  totalDays: number;
  workingDays: Date[];
  publicHolidays: Date[];
  weekends: Date[];
  isLeapYear: boolean;
}

// Attendance Types
export interface AttendanceStatus {
  requiredDays: number;
  completedDays: number;
  remainingDays: number;
  isOnTrack: boolean;
  annualLeaveDays: number;
}

// View Management Types
export interface ViewState {
  currentView: 'year' | 'month';
  selectedYear: number;
  selectedMonth?: number;
}

export interface YearSummary {
  year: number;
  monthSummaries: MonthSummary[];
  totalRequiredDays: number;
  totalCompletedDays: number;
  overallProgress: number;
}

export interface MonthSummary {
  month: number;
  monthName: string;
  requiredDays: number;
  completedDays: number;
  annualLeaveDays: number;
  isOnTrack: boolean;
}

// Data Storage Types
export interface UserData {
  configuration: Configuration;
  attendanceData: AttendanceData;
  annualLeaveData: AnnualLeaveData;
}

export interface AttendanceData {
  [year: number]: {
    [month: number]: {
      [day: number]: boolean;
    };
  };
}

export interface AnnualLeaveData {
  [year: number]: {
    [month: number]: number;
  };
}

export interface HolidayData {
  [location: string]: {
    [year: number]: Date[];
  };
}

// Manager Interfaces
export interface ConfigurationManager {
  setLocation(location: string): void;
  setYear(year: number): void;
  setInOfficePercentage(percentage: number): void;
  getConfiguration(): Configuration;
  getSupportedLocations(): string[];
  addConfigurationChangeListener(listener: (configuration: Configuration) => void): void;
  removeConfigurationChangeListener(listener: (configuration: Configuration) => void): void;
  resetToDefaults(): void;
}

export interface CalendarEngine {
  getWorkingDays(month: number, year: number): Date[];
  getPublicHolidays(month: number, year: number, location: string): Date[];
  isWorkingDay(date: Date, location: string): boolean;
  isLeapYear(year: number): boolean;
  getDaysInMonth(month: number, year: number): number;
  getMonthData(month: number, year: number, location: string): MonthData;
}

export interface AttendanceTracker {
  markOfficeDay(date: Date): void;
  unmarkOfficeDay(date: Date): void;
  setAnnualLeave(month: number, year: number, days: number): void;
  getAnnualLeave(month: number, year: number): number;
  getAttendanceStatus(month: number, year: number): AttendanceStatus;
  calculateRequiredDays(month: number, year: number): number;
}

export interface StorageManager {
  save(key: string, data: any): void;
  load<T>(key: string): T | null;
  isAvailable(): boolean;
  clear(): void;
}

export interface ViewManager {
  showYearView(year: number): void;
  showMonthView(month: number, year: number): void;
  getCurrentView(): ViewState;
  getYearSummary(year: number): YearSummary;
}