import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ConfigurationForm } from '../ConfigurationForm';
import { ConfigurationManager } from '../../services/ConfigurationManager';
import type { Configuration } from '../../types';

describe('ConfigurationForm', () => {
  let configurationManager: ConfigurationManager;
  let mockOnConfigurationChange: jest.Mock;

  beforeEach(() => {
    configurationManager = new ConfigurationManager();
    mockOnConfigurationChange = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('renders all form fields with correct labels', () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/required in-office percentage/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save configuration/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset to defaults/i })).toBeInTheDocument();
    });

    it('displays current configuration values', () => {
      // Set specific configuration
      configurationManager.setLocation('US');
      configurationManager.setYear(2023);
      configurationManager.setInOfficePercentage(75);

      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      expect(screen.getByDisplayValue('US')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2023')).toBeInTheDocument();
      expect(screen.getByDisplayValue('75')).toBeInTheDocument();
    });

    it('shows supported locations in dropdown', () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const locationSelect = screen.getByLabelText(/location/i);
      expect(locationSelect).toBeInTheDocument();

      // Check that supported locations are available as options
      expect(screen.getByRole('option', { name: 'UK' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'US' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Mexico' })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('shows error when location is not selected', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const locationSelect = screen.getByLabelText(/location/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Clear location and submit
      fireEvent.change(locationSelect, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      });
    });

    it('shows error when percentage is out of range', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const percentageInput = screen.getByLabelText(/required in-office percentage/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Set invalid percentage
      fireEvent.change(percentageInput, { target: { value: '150' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/percentage must be between 0 and 100/i)).toBeInTheDocument();
      });
    });

    it('shows error when year is invalid', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const yearSelect = screen.getByLabelText(/year/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Clear year and submit
      fireEvent.change(yearSelect, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/year is required/i)).toBeInTheDocument();
      });
    });

    it('clears error when user corrects invalid input', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const percentageInput = screen.getByLabelText(/required in-office percentage/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Set invalid percentage and submit to show error
      fireEvent.change(percentageInput, { target: { value: '150' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/percentage must be between 0 and 100/i)).toBeInTheDocument();
      });

      // Correct the input
      fireEvent.change(percentageInput, { target: { value: '50' } });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/percentage must be between 0 and 100/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Configuration Saving', () => {
    it('saves valid configuration successfully', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const locationSelect = screen.getByLabelText(/location/i);
      const yearSelect = screen.getByLabelText(/year/i);
      const percentageInput = screen.getByLabelText(/required in-office percentage/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Fill form with valid data
      fireEvent.change(locationSelect, { target: { value: 'US' } });
      fireEvent.change(yearSelect, { target: { value: '2024' } });
      fireEvent.change(percentageInput, { target: { value: '80' } });

      // Submit form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/configuration saved successfully/i)).toBeInTheDocument();
      });

      // Verify configuration was saved
      const savedConfig = configurationManager.getConfiguration();
      expect(savedConfig.location).toBe('US');
      expect(savedConfig.year).toBe(2024);
      expect(savedConfig.inOfficePercentage).toBe(80);

      // Verify callback was called
      expect(mockOnConfigurationChange).toHaveBeenCalledWith({
        location: 'US',
        year: 2024,
        inOfficePercentage: 80
      });
    });

    it('prevents submission with invalid data', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const locationSelect = screen.getByLabelText(/location/i);
      const percentageInput = screen.getByLabelText(/required in-office percentage/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Set invalid data
      fireEvent.change(locationSelect, { target: { value: '' } });
      fireEvent.change(percentageInput, { target: { value: '150' } });

      // Submit form
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/location is required/i)).toBeInTheDocument();
        expect(screen.getByText(/percentage must be between 0 and 100/i)).toBeInTheDocument();
      });

      // Verify callback was not called
      expect(mockOnConfigurationChange).not.toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('resets configuration to defaults when reset button is clicked', async () => {
      // Set non-default configuration
      configurationManager.setLocation('US');
      configurationManager.setYear(2025);
      configurationManager.setInOfficePercentage(90);

      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const resetButton = screen.getByRole('button', { name: /reset to defaults/i });

      // Click reset
      fireEvent.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText(/configuration reset to defaults/i)).toBeInTheDocument();
      });

      // Verify form shows default values
      const currentYear = new Date().getFullYear();
      expect(screen.getByDisplayValue('UK')).toBeInTheDocument();
      expect(screen.getByDisplayValue(currentYear.toString())).toBeInTheDocument();
      expect(screen.getByDisplayValue('60')).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('displays error messages with proper ARIA attributes', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const locationSelect = screen.getByLabelText(/location/i);
      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Clear location and submit to trigger error
      fireEvent.change(locationSelect, { target: { value: '' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/location is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(locationSelect).toHaveAttribute('aria-describedby', 'location-error');
      });
    });

    it('shows success message after successful save', async () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      const submitButton = screen.getByRole('button', { name: /save configuration/i });

      // Submit with default valid configuration
      fireEvent.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByText(/configuration saved successfully/i);
        expect(successMessage).toBeInTheDocument();
        expect(successMessage).toHaveAttribute('role', 'alert');
        expect(successMessage).toHaveClass('success');
      });
    });
  });

  describe('Form Accessibility', () => {
    it('has proper form labels and ARIA attributes', () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      // Check that all form controls have proper labels
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/required in-office percentage/i)).toBeInTheDocument();

      // Check help text is properly associated
      const percentageInput = screen.getByLabelText(/required in-office percentage/i);
      expect(percentageInput).toHaveAttribute('aria-describedby', 'percentage-help');
    });

    it('marks required fields appropriately', () => {
      render(
        <ConfigurationForm
          configurationManager={configurationManager}
          onConfigurationChange={mockOnConfigurationChange}
        />
      );

      // Check that required indicators are present
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators).toHaveLength(3); // All three fields are required
    });
  });
});