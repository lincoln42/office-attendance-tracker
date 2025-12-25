import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnnualLeaveInput } from '../AnnualLeaveInput';
import { AttendanceTracker } from '../../services/AttendanceTracker';
import { CalendarEngine } from '../../services/CalendarEngine';
import { ConfigurationManager } from '../../services/ConfigurationManager';
import { StorageManager } from '../../services/StorageManager';

describe('AnnualLeaveInput', () => {
  let attendanceTracker: AttendanceTracker;
  let calendarEngine: CalendarEngine;
  let configurationManager: ConfigurationManager;
  let storageManager: StorageManager;
  let mockOnLeaveChange: jest.Mock;

  beforeEach(() => {
    storageManager = new StorageManager();
    calendarEngine = new CalendarEngine();
    configurationManager = new ConfigurationManager();
    attendanceTracker = new AttendanceTracker(calendarEngine, configurationManager, storageManager);
    mockOnLeaveChange = jest.fn();

    // Set up default configuration
    configurationManager.setLocation('UK');
    configurationManager.setYear(2024);
    configurationManager.setInOfficePercentage(60);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders annual leave form with all 12 months', () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      expect(screen.getByText('Annual Leave')).toBeInTheDocument();
      expect(screen.getByText('Total Working Days:')).toBeInTheDocument();
      expect(screen.getByText('Total Annual Leave:')).toBeInTheDocument();

      // Check all 12 months are displayed
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      monthNames.forEach(month => {
        expect(screen.getByText(month)).toBeInTheDocument();
      });
    });

    it('displays working days context for each month', () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      // Check that working days context is shown (should see "/ X working days" text)
      const workingDaysTexts = screen.getAllByText(/\/ \d+ working days/);
      expect(workingDaysTexts).toHaveLength(12); // One for each month
    });

    it('shows current annual leave values', () => {
      // Set some annual leave
      attendanceTracker.setAnnualLeave(1, 2024, 5); // January
      attendanceTracker.setAnnualLeave(6, 2024, 3); // June

      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');
      const juneInput = screen.getByLabelText('June');

      expect(januaryInput).toHaveValue(5);
      expect(juneInput).toHaveValue(3);
    });
  });

  describe('Input Validation', () => {
    it('accepts valid annual leave values', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      // Use a value that's definitely within the working days limit
      fireEvent.change(januaryInput, { target: { value: '2' } });

      // Should not show error message
      expect(screen.queryByText(/cannot exceed/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/cannot be negative/i)).not.toBeInTheDocument();

      expect(mockOnLeaveChange).toHaveBeenCalled();
    });

    it('shows error when annual leave exceeds working days', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      // Try to set more leave days than working days in January
      fireEvent.change(januaryInput, { target: { value: '50' } });

      await waitFor(() => {
        expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument();
      });

      expect(mockOnLeaveChange).not.toHaveBeenCalled();
    });

    it('shows error for negative values', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      fireEvent.change(januaryInput, { target: { value: '-1' } });

      await waitFor(() => {
        expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument();
      });

      expect(mockOnLeaveChange).not.toHaveBeenCalled();
    });

    it('clears error when user corrects invalid input', async () => {
      // Create a mock AttendanceTracker that doesn't throw errors
      const mockAttendanceTracker = {
        setAnnualLeave: jest.fn(),
        getAnnualLeave: jest.fn().mockReturnValue(0),
      } as any;

      render(
        <AnnualLeaveInput
          attendanceTracker={mockAttendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      // First enter invalid value
      fireEvent.change(januaryInput, { target: { value: '50' } });

      await waitFor(() => {
        expect(screen.getByText(/cannot exceed/i)).toBeInTheDocument();
      });

      // Then correct it to a valid value
      fireEvent.change(januaryInput, { target: { value: '2' } });

      await waitFor(() => {
        expect(screen.queryByText(/cannot exceed/i)).not.toBeInTheDocument();
      });

      expect(mockOnLeaveChange).toHaveBeenCalled();
    });
  });

  describe('Automatic Recalculation', () => {
    it('updates total annual leave when individual month values change', async () => {
      // Clear any existing leave data first
      for (let month = 1; month <= 12; month++) {
        attendanceTracker.setAnnualLeave(month, 2024, 0);
      }

      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');
      const februaryInput = screen.getByLabelText('February');

      // Set leave for January
      fireEvent.change(januaryInput, { target: { value: '3' } });

      await waitFor(() => {
        // Check that the total annual leave summary shows 3
        const summaryValues = screen.getAllByText('3');
        expect(summaryValues.length).toBeGreaterThan(0);
      });

      // Add leave for February
      fireEvent.change(februaryInput, { target: { value: '2' } });

      await waitFor(() => {
        // Check that the total annual leave summary shows 5
        const summaryValues = screen.getAllByText('5');
        expect(summaryValues.length).toBeGreaterThan(0);
      });

      expect(mockOnLeaveChange).toHaveBeenCalledTimes(2);
    });

    it('calls onLeaveChange callback when leave is modified', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      fireEvent.change(januaryInput, { target: { value: '5' } });

      await waitFor(() => {
        expect(mockOnLeaveChange).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Working Days Display', () => {
    it('shows correct working days count for each month', () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      // January 2024 should have working days (excluding weekends and holidays)
      const januaryWorkingDays = calendarEngine.getMonthData(1, 2024, 'UK').workingDays.length;
      expect(screen.getByText(`/ ${januaryWorkingDays} working days`)).toBeInTheDocument();
    });

    it('updates working days when configuration changes', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      // Change location which affects holidays and working days
      configurationManager.setLocation('US');

      await waitFor(() => {
        // Should recalculate working days for US holidays
        const januaryWorkingDaysUS = calendarEngine.getMonthData(1, 2024, 'US').workingDays.length;
        const workingDaysTexts = screen.getAllByText(`/ ${januaryWorkingDaysUS} working days`);
        expect(workingDaysTexts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Clear All Functionality', () => {
    it('clears all annual leave when Clear All button is clicked', async () => {
      // Set some initial leave
      attendanceTracker.setAnnualLeave(1, 2024, 5);
      attendanceTracker.setAnnualLeave(6, 2024, 3);

      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('All annual leave cleared')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Total should be 0
      });

      // Check that all inputs are cleared
      const januaryInput = screen.getByLabelText('January');
      const juneInput = screen.getByLabelText('June');

      expect(januaryInput).toHaveValue(0);
      expect(juneInput).toHaveValue(0);

      expect(mockOnLeaveChange).toHaveBeenCalled();
    });

    it('shows success message after clearing all leave', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('All annual leave cleared')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      // Check that all month inputs have proper labels
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      monthNames.forEach(month => {
        const input = screen.getByLabelText(month);
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('type', 'number');
        expect(input).toHaveAttribute('min', '0');
      });
    });

    it('displays error messages with proper ARIA attributes', async () => {
      render(
        <AnnualLeaveInput
          attendanceTracker={attendanceTracker}
          calendarEngine={calendarEngine}
          configurationManager={configurationManager}
          onLeaveChange={mockOnLeaveChange}
        />
      );

      const januaryInput = screen.getByLabelText('January');

      fireEvent.change(januaryInput, { target: { value: '50' } });

      await waitFor(() => {
        const errorMessage = screen.getByText(/cannot exceed/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});