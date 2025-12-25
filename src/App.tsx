import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  YearView,
  MonthCalendar,
  ConfigurationForm,
  AnnualLeaveInput,
  ProgressDisplay
} from './components';
import {
  ConfigurationManager,
  CalendarEngine,
  AttendanceTracker,
  StorageManager,
  ViewManager
} from './services';
import type {
  Configuration,
  ViewState,
  YearSummary,
  AttendanceStatus
} from './types';
import './App.css';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>The application encountered an error. Please refresh the page to try again.</p>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  // Initialize managers
  const storageManager = useMemo(() => new StorageManager(), []);
  const configurationManager = useMemo(() => new ConfigurationManager(), []);
  const calendarEngine = useMemo(() => new CalendarEngine(), []);
  const attendanceTracker = useMemo(() => new AttendanceTracker(calendarEngine, configurationManager, storageManager), [calendarEngine, configurationManager, storageManager]);
  const viewManager = useMemo(() => new ViewManager(attendanceTracker, calendarEngine, configurationManager), [attendanceTracker, calendarEngine, configurationManager]);

  // Application state
  const [configuration, setConfiguration] = useState<Configuration>(configurationManager.getConfiguration());
  const [viewState, setViewState] = useState<ViewState>(viewManager.getCurrentView());
  const [yearSummary, setYearSummary] = useState<YearSummary | null>(null);
  const [monthAttendanceStatus, setMonthAttendanceStatus] = useState<AttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Check storage availability and show warning if needed
  useEffect(() => {
    if (!storageManager.isAvailable()) {
      setStorageWarning('Local storage is not available. Your data will not be saved between sessions.');
    }
  }, [storageManager]);

  // Configuration change handler
  const handleConfigurationChange = useCallback((newConfig: Configuration) => {
    setConfiguration(newConfig);
    // Update view state to reflect new year if changed
    if (newConfig.year !== viewState.selectedYear) {
      if (viewState.currentView === 'year') {
        viewManager.showYearView(newConfig.year);
      } else if (viewState.selectedMonth !== undefined) {
        viewManager.showMonthView(viewState.selectedMonth, newConfig.year);
      }
      setViewState(viewManager.getCurrentView());
    }
  }, [viewManager, viewState]);

  // Set up configuration change listener
  useEffect(() => {
    configurationManager.addConfigurationChangeListener(handleConfigurationChange);
    return () => {
      configurationManager.removeConfigurationChangeListener(handleConfigurationChange);
    };
  }, [configurationManager, handleConfigurationChange]);

  // Update data when view state changes
  useEffect(() => {
    const updateData = async () => {
      setIsLoading(true);
      try {
        if (viewState.currentView === 'year') {
          const summary = viewManager.getYearSummary(viewState.selectedYear);
          setYearSummary(summary);
          setMonthAttendanceStatus(null);
        } else if (viewState.selectedMonth !== undefined) {
          const status = attendanceTracker.getAttendanceStatus(viewState.selectedMonth, viewState.selectedYear);
          setMonthAttendanceStatus(status);
          setYearSummary(null);
        }
      } catch (error) {
        console.error('Error updating data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateData();
  }, [viewState, attendanceTracker, viewManager]);

  // Initial data load
  useEffect(() => {
    const initializeApp = async () => {
      setIsLoading(true);
      try {
        // Initialize with current view
        const currentView = viewManager.getCurrentView();
        setViewState(currentView);

        if (currentView.currentView === 'year') {
          const summary = viewManager.getYearSummary(currentView.selectedYear);
          setYearSummary(summary);
        } else if (currentView.selectedMonth !== undefined) {
          const status = attendanceTracker.getAttendanceStatus(currentView.selectedMonth, currentView.selectedYear);
          setMonthAttendanceStatus(status);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [viewManager, attendanceTracker]);

  // View navigation handlers
  const handleShowYearView = useCallback((year: number) => {
    viewManager.showYearView(year);
    setViewState(viewManager.getCurrentView());
  }, [viewManager]);

  const handleShowMonthView = useCallback((month: number, year: number) => {
    viewManager.showMonthView(month, year);
    setViewState(viewManager.getCurrentView());
  }, [viewManager]);

  // Attendance marking handlers
  const handleMarkOfficeDay = useCallback((date: Date) => {
    attendanceTracker.markOfficeDay(date);
    // Refresh current view data
    if (viewState.currentView === 'year') {
      const summary = viewManager.getYearSummary(viewState.selectedYear);
      setYearSummary(summary);
    } else if (viewState.selectedMonth !== undefined) {
      const status = attendanceTracker.getAttendanceStatus(viewState.selectedMonth, viewState.selectedYear);
      setMonthAttendanceStatus(status);
    }
  }, [attendanceTracker, viewManager, viewState]);

  const handleUnmarkOfficeDay = useCallback((date: Date) => {
    attendanceTracker.unmarkOfficeDay(date);
    // Refresh current view data
    if (viewState.currentView === 'year') {
      const summary = viewManager.getYearSummary(viewState.selectedYear);
      setYearSummary(summary);
    } else if (viewState.selectedMonth !== undefined) {
      const status = attendanceTracker.getAttendanceStatus(viewState.selectedMonth, viewState.selectedYear);
      setMonthAttendanceStatus(status);
    }
  }, [attendanceTracker, viewManager, viewState]);



  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" aria-label="Loading application">
          <div className="spinner"></div>
        </div>
        <p>Loading Office Attendance Tracker...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>Office Attendance Tracker</h1>
          {storageWarning && (
            <div className="storage-warning" role="alert">
              <strong>Warning:</strong> {storageWarning}
            </div>
          )}
        </header>

        <main className="app-main">
          {/* Configuration Section */}
          <section className="configuration-section">
            <h2>Configuration</h2>
            <ConfigurationForm
              configurationManager={configurationManager}
              onConfigurationChange={handleConfigurationChange}
            />
          </section>

          {/* Annual Leave Section */}
          <section className="annual-leave-section">
            <h2>Annual Leave</h2>
            <AnnualLeaveInput
              attendanceTracker={attendanceTracker}
              calendarEngine={calendarEngine}
              configurationManager={configurationManager}
              onLeaveChange={() => {
                // Refresh current view data
                if (viewState.currentView === 'year') {
                  const summary = viewManager.getYearSummary(viewState.selectedYear);
                  setYearSummary(summary);
                } else if (viewState.selectedMonth !== undefined) {
                  const status = attendanceTracker.getAttendanceStatus(viewState.selectedMonth, viewState.selectedYear);
                  setMonthAttendanceStatus(status);
                }
              }}
            />
          </section>

          {/* Progress Section */}
          <section className="progress-section">
            <h2>Progress Overview</h2>
            {viewState.currentView === 'year' && yearSummary && (
              <div>
                <h3>Year Progress</h3>
                <div className="year-progress-summary">
                  <div className="summary-stat">
                    <span>Total Required: {yearSummary.totalRequiredDays}</span>
                  </div>
                  <div className="summary-stat">
                    <span>Total Completed: {yearSummary.totalCompletedDays}</span>
                  </div>
                  <div className="summary-stat">
                    <span>Overall Progress: {yearSummary.overallProgress}%</span>
                  </div>
                </div>
              </div>
            )}
            {viewState.currentView === 'month' && monthAttendanceStatus && (
              <ProgressDisplay
                status={monthAttendanceStatus}
                variant="monthly"
                showDetails={true}
              />
            )}
          </section>

          {/* Calendar Section */}
          <section className="calendar-section">
            <div className="view-navigation">
              <button
                onClick={() => handleShowYearView(configuration.year)}
                className={viewState.currentView === 'year' ? 'active' : ''}
                aria-pressed={viewState.currentView === 'year'}
              >
                Year View
              </button>
              {viewState.selectedMonth !== undefined && (
                <button
                  onClick={() => handleShowMonthView(viewState.selectedMonth!, viewState.selectedYear)}
                  className={viewState.currentView === 'month' ? 'active' : ''}
                  aria-pressed={viewState.currentView === 'month'}
                >
                  Month View
                </button>
              )}
            </div>

            {viewState.currentView === 'year' && yearSummary && (
              <YearView
                year={viewState.selectedYear}
                yearSummary={yearSummary}
                onMonthSelect={handleShowMonthView}
              />
            )}

            {viewState.currentView === 'month' && viewState.selectedMonth !== undefined && (
              <div>
                <div className="month-navigation">
                  <button
                    onClick={() => handleShowYearView(viewState.selectedYear)}
                    className="back-to-year-btn"
                  >
                    ← Back to Year View
                  </button>
                </div>
                <MonthCalendar
                  month={viewState.selectedMonth}
                  year={viewState.selectedYear}
                  location={configuration.location}
                  calendarEngine={calendarEngine}
                  attendanceTracker={attendanceTracker}
                  onDayClick={(date: Date) => {
                    const isWorkingDay = calendarEngine.isWorkingDay(date, configuration.location);
                    if (isWorkingDay) {
                      // Check if already marked and toggle
                      const isMarked = attendanceTracker.isOfficeDay(date);
                      if (isMarked) {
                        handleUnmarkOfficeDay(date);
                      } else {
                        handleMarkOfficeDay(date);
                      }
                    }
                  }}
                />
              </div>
            )}
          </section>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App
