import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MonthCalendar } from '../MonthCalendar';
import { CalendarEngine } from '../../services/CalendarEngine';
import { AttendanceTracker } from '../../services/AttendanceTracker';

// Mock the services
jest.mock('../../services/CalendarEngine');
jest.mock('../../services/AttendanceTracker');

describe('MonthCalendar Unit Tests', () => {
  let mockCalendarEngine: jest.Mocked<CalendarEngine>;
  let mockAttendanceTracker: jest.Mocked<AttendanceTracker>;

  beforeEach(() => {
    mockCalendarEngine = new CalendarEngine() as jest.Mocked<CalendarEngine>;

    // Create a proper StorageManager mock
    const mockStorageManager = {
      save: jest.fn(),
      load: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
      clear: jest.fn()
    };

    mockAttendanceTracker = new AttendanceTracker(
      mockCalendarEngine,
      {} as any,
      mockStorageManager
    ) as jest.Mocked<AttendanceTracker>;

    // Setup default mock implementations
    mockCalendarEngine.getDaysInMonth.mockReturnValue(31);
    mockCalendarEngine.getMonthData.mockReturnValue({
      totalDays: 31,
      workingDays: [new Date(2024, 0, 1), new Date(2024, 0, 2)],
      publicHolidays: [new Date(2024, 0, 1)], // New Year's Day
      weekends: [new Date(2024, 0, 6), new Date(2024, 0, 7)],
      isLeapYear: true
    });
    mockCalendarEngine.isWorkingDay.mockReturnValue(true);
    mockAttendanceTracker.isOfficeDay.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Calendar rendering for different months', () => {
    it('should render January 2024 correctly', () => {
      render(<MonthCalendar month={1} year={2024} calendarEngine={mockCalendarEngine} />);

      expect(screen.getByText('January 2024')).toBeInTheDocument();
      expect(mockCalendarEngine.getMonthData).toHaveBeenCalledWith(1, 2024, 'UK');
    });

    it('should render February 2024 (leap year) correctly', () => {
      mockCalendarEngine.getDaysInMonth.mockReturnValue(29);
      mockCalendarEngine.getMonthData.mockReturnValue({
        totalDays: 29,
        workingDays: [],
        publicHolidays: [],
        weekends: [],
        isLeapYear: true
      });

      render(<MonthCalendar month={2} year={2024} calendarEngine={mockCalendarEngine} />);

      expect(screen.getByText('February 2024')).toBeInTheDocument();
      expect(mockCalendarEngine.getMonthData).toHaveBeenCalledWith(2, 2024, 'UK');
    });

    it('should render with custom location', () => {
      render(<MonthCalendar month={6} year={2024} location="US" calendarEngine={mockCalendarEngine} />);

      expect(mockCalendarEngine.getMonthData).toHaveBeenCalledWith(6, 2024, 'US');
    });

    it('should display all days of the month', () => {
      const { container } = render(<MonthCalendar month={1} year={2024} calendarEngine={mockCalendarEngine} />);

      // Check that days 1-31 are rendered
      for (let day = 1; day <= 31; day++) {
        const dayElement = container.querySelector(`[data-day="${day}"]`);
        expect(dayElement).toBeInTheDocument();
        expect(dayElement).toHaveTextContent(day.toString());
      }
    });
  });

  describe('Day click interactions', () => {
    it('should call onDayClick when a working day is clicked', () => {
      const mockOnDayClick = jest.fn();
      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
          onDayClick={mockOnDayClick}
        />
      );

      const dayElement = container.querySelector('[data-day="15"]');
      expect(dayElement).toBeInTheDocument();

      fireEvent.click(dayElement!);

      expect(mockOnDayClick).toHaveBeenCalledWith(new Date(2024, 0, 15));
    });

    it('should toggle attendance when attendanceTracker is provided and no onDayClick', () => {
      mockAttendanceTracker.isOfficeDay.mockReturnValue(false);

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
          attendanceTracker={mockAttendanceTracker}
        />
      );

      const dayElement = container.querySelector('[data-day="15"]');
      fireEvent.click(dayElement!);

      expect(mockAttendanceTracker.markOfficeDay).toHaveBeenCalledWith(new Date(2024, 0, 15));
    });

    it('should unmark attendance when day is already marked', () => {
      mockAttendanceTracker.isOfficeDay.mockReturnValue(true);

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
          attendanceTracker={mockAttendanceTracker}
        />
      );

      const dayElement = container.querySelector('[data-day="15"]');
      fireEvent.click(dayElement!);

      expect(mockAttendanceTracker.unmarkOfficeDay).toHaveBeenCalledWith(new Date(2024, 0, 15));
    });

    it('should not allow clicking on non-working days', () => {
      mockCalendarEngine.isWorkingDay.mockReturnValue(false);
      const mockOnDayClick = jest.fn();

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
          onDayClick={mockOnDayClick}
        />
      );

      const dayElement = container.querySelector('[data-day="15"]');
      fireEvent.click(dayElement!);

      expect(mockOnDayClick).not.toHaveBeenCalled();
    });
  });

  describe('Visual state changes', () => {
    it('should apply holiday styling to public holidays', () => {
      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
        />
      );

      const holidayElement = container.querySelector('[data-day="1"]');
      expect(holidayElement).toHaveClass('holiday');
      expect(holidayElement).toHaveClass('public-holiday');
      expect(holidayElement).toHaveAttribute('data-holiday', 'true');
    });

    it('should apply office day styling to marked attendance days', () => {
      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
          markedOfficeDays={[15, 16]}
        />
      );

      const markedDay = container.querySelector('[data-day="15"]');
      expect(markedDay).toHaveClass('office-day');
      expect(markedDay).toHaveClass('marked');
      expect(markedDay).toHaveClass('attended');
      expect(markedDay).toHaveAttribute('data-office-day', 'true');

      const unmarkedDay = container.querySelector('[data-day="20"]');
      expect(unmarkedDay).not.toHaveClass('office-day');
    });

    it('should apply current day styling when viewing current month', () => {
      const today = new Date();
      const currentMonth = today.getMonth() + 1;
      const currentYear = today.getFullYear();
      const currentDay = today.getDate();

      const { container } = render(
        <MonthCalendar
          month={currentMonth}
          year={currentYear}
          calendarEngine={mockCalendarEngine}
        />
      );

      const todayElement = container.querySelector(`[data-day="${currentDay}"]`);
      expect(todayElement).toHaveClass('current-day');
      expect(todayElement).toHaveClass('today');
    });

    it('should apply working day styling to working days', () => {
      mockCalendarEngine.isWorkingDay.mockImplementation((date) => {
        return date.getDate() === 15; // Only day 15 is a working day
      });

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
        />
      );

      const workingDay = container.querySelector('[data-day="15"]');
      expect(workingDay).toHaveClass('working-day');

      const nonWorkingDay = container.querySelector('[data-day="14"]');
      expect(nonWorkingDay).not.toHaveClass('working-day');
    });

    it('should apply weekend styling to weekend days', () => {
      // Mock a Saturday (day 6) and Sunday (day 7) in January 2024
      mockCalendarEngine.getMonthData.mockReturnValue({
        totalDays: 31,
        workingDays: [],
        publicHolidays: [],
        weekends: [new Date(2024, 0, 6), new Date(2024, 0, 7)], // Saturday and Sunday
        isLeapYear: true
      });

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
        />
      );

      // January 6, 2024 is a Saturday
      const saturday = container.querySelector('[data-day="6"]');
      expect(saturday).toHaveClass('weekend');

      // January 7, 2024 is a Sunday  
      const sunday = container.querySelector('[data-day="7"]');
      expect(sunday).toHaveClass('weekend');
    });
  });

  describe('Accessibility features', () => {
    it('should have proper ARIA labels for working days', () => {
      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
        />
      );

      const workingDay = container.querySelector('[data-day="15"]');
      expect(workingDay).toHaveAttribute('aria-label', 'January 15, 2024, working day');
      expect(workingDay).toHaveAttribute('role', 'gridcell');
      expect(workingDay).toHaveAttribute('tabIndex', '0');
    });

    it('should not have button role for non-working days', () => {
      mockCalendarEngine.isWorkingDay.mockReturnValue(false);

      const { container } = render(
        <MonthCalendar
          month={1}
          year={2024}
          calendarEngine={mockCalendarEngine}
        />
      );

      const nonWorkingDay = container.querySelector('[data-day="15"]');
      expect(nonWorkingDay).toHaveAttribute('role', 'gridcell');
      expect(nonWorkingDay).not.toHaveAttribute('tabIndex');
    });

    it('should render week day headers', () => {
      render(<MonthCalendar month={1} year={2024} calendarEngine={mockCalendarEngine} />);

      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      weekDays.forEach(day => {
        expect(screen.getByText(day)).toBeInTheDocument();
      });
    });
  });
});