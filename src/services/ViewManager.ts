import type {
  ViewManager as IViewManager,
  ViewState,
  YearSummary,
  MonthSummary,
  AttendanceTracker,
  CalendarEngine,
  ConfigurationManager
} from '../types';

export class ViewManager implements IViewManager {
  private viewState: ViewState = {
    currentView: 'year',
    selectedYear: new Date().getFullYear()
  };

  private changeListeners: Array<(viewState: ViewState) => void> = [];

  private attendanceTracker: AttendanceTracker;
  private calendarEngine: CalendarEngine;
  private configurationManager: ConfigurationManager;

  constructor(
    attendanceTracker: AttendanceTracker,
    calendarEngine: CalendarEngine,
    configurationManager: ConfigurationManager
  ) {
    this.attendanceTracker = attendanceTracker;
    this.calendarEngine = calendarEngine;
    this.configurationManager = configurationManager;
  }

  showYearView(year: number): void {
    const previousView = { ...this.viewState };
    this.viewState = {
      currentView: 'year',
      selectedYear: year
    };

    // Only notify if view actually changed
    if (previousView.currentView !== 'year' || previousView.selectedYear !== year) {
      this.notifyChangeListeners();
    }
  }

  showMonthView(month: number, year: number): void {
    const previousView = { ...this.viewState };
    this.viewState = {
      currentView: 'month',
      selectedYear: year,
      selectedMonth: month
    };

    // Only notify if view actually changed
    if (previousView.currentView !== 'month' ||
      previousView.selectedYear !== year ||
      previousView.selectedMonth !== month) {
      this.notifyChangeListeners();
    }
  }

  getCurrentView(): ViewState {
    return { ...this.viewState };
  }

  getYearSummary(year: number): YearSummary {
    const config = this.configurationManager.getConfiguration();
    const monthSummaries: MonthSummary[] = [];
    let totalRequiredDays = 0;
    let totalCompletedDays = 0;

    // Generate summaries for all 12 months
    for (let month = 1; month <= 12; month++) {
      const attendanceStatus = this.attendanceTracker.getAttendanceStatus(month, year);
      const monthName = this.getMonthName(month);

      const monthSummary: MonthSummary = {
        month,
        monthName,
        requiredDays: attendanceStatus.requiredDays,
        completedDays: attendanceStatus.completedDays,
        annualLeaveDays: attendanceStatus.annualLeaveDays,
        isOnTrack: attendanceStatus.isOnTrack
      };

      monthSummaries.push(monthSummary);
      totalRequiredDays += attendanceStatus.requiredDays;
      totalCompletedDays += attendanceStatus.completedDays;
    }

    // Calculate overall progress percentage
    const overallProgress = totalRequiredDays > 0
      ? Math.round((totalCompletedDays / totalRequiredDays) * 100)
      : 0;

    return {
      year,
      monthSummaries,
      totalRequiredDays,
      totalCompletedDays,
      overallProgress
    };
  }

  private getMonthName(month: number): string {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month - 1];
  }

  private notifyChangeListeners(): void {
    const viewStateCopy = { ...this.viewState };
    this.changeListeners.forEach(listener => {
      try {
        listener(viewStateCopy);
      } catch (error) {
        console.error('Error in view change listener:', error);
      }
    });
  }

  /**
   * Add a listener for view state changes
   */
  addViewChangeListener(listener: (viewState: ViewState) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a view change listener
   */
  removeViewChangeListener(listener: (viewState: ViewState) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }
}