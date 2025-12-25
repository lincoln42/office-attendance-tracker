import React, { useState, useEffect } from 'react';
import type { Configuration, ConfigurationManager } from '../types';
import './ConfigurationForm.css';

interface ConfigurationFormProps {
  configurationManager: ConfigurationManager;
  onConfigurationChange?: (config: Configuration) => void;
}

interface FormData {
  location: string;
  year: number | string;
  inOfficePercentage: number | string;
}

interface FormErrors {
  location?: string;
  year?: string;
  inOfficePercentage?: string;
}

export const ConfigurationForm: React.FC<ConfigurationFormProps> = ({
  configurationManager,
  onConfigurationChange
}) => {
  const [formData, setFormData] = useState<FormData>(() => {
    const config = configurationManager.getConfiguration();
    return {
      location: config.location,
      year: config.year,
      inOfficePercentage: config.inOfficePercentage
    };
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  const supportedLocations = configurationManager.getSupportedLocations();

  // Update form data when configuration changes externally
  useEffect(() => {
    const handleConfigChange = (config: Configuration) => {
      setFormData({
        location: config.location,
        year: config.year,
        inOfficePercentage: config.inOfficePercentage
      });
      setSaveMessage('');
    };

    configurationManager.addConfigurationChangeListener(handleConfigChange);
    return () => {
      configurationManager.removeConfigurationChangeListener(handleConfigChange);
    };
  }, [configurationManager]);

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};

    // Validate location
    if (!formData.location) {
      newErrors.location = 'Location is required';
    } else if (!supportedLocations.includes(formData.location)) {
      newErrors.location = `Location must be one of: ${supportedLocations.join(', ')}`;
    }

    // Validate year
    if (formData.year === '' || formData.year === undefined || formData.year === null) {
      newErrors.year = 'Year is required';
    } else {
      const yearNum = typeof formData.year === 'string' ? parseInt(formData.year, 10) : formData.year;
      if (isNaN(yearNum) || !Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
        newErrors.year = 'Year must be between 1900 and 2100';
      }
    }

    // Validate percentage
    if (formData.inOfficePercentage === '' || formData.inOfficePercentage === undefined || formData.inOfficePercentage === null) {
      newErrors.inOfficePercentage = 'In-office percentage is required';
    } else {
      const percentageNum = typeof formData.inOfficePercentage === 'string' ? parseFloat(formData.inOfficePercentage) : formData.inOfficePercentage;
      if (isNaN(percentageNum) || !Number.isFinite(percentageNum) || percentageNum < 0 || percentageNum > 100) {
        newErrors.inOfficePercentage = 'Percentage must be between 0 and 100';
      }
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }

    // Clear save message when form is modified
    if (saveMessage) {
      setSaveMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      try {
        // Convert form data to proper types
        const year = typeof formData.year === 'string' ? parseInt(formData.year, 10) : formData.year;
        const percentage = typeof formData.inOfficePercentage === 'string' ? parseFloat(formData.inOfficePercentage) : formData.inOfficePercentage;

        // Save configuration using the manager
        configurationManager.setLocation(formData.location);
        configurationManager.setYear(year);
        configurationManager.setInOfficePercentage(percentage);

        setSaveMessage('Configuration saved successfully!');

        // Notify parent component
        if (onConfigurationChange) {
          onConfigurationChange({
            location: formData.location,
            year,
            inOfficePercentage: percentage
          });
        }
      } catch (error) {
        console.error('Error saving configuration:', error);
        setSaveMessage('Error saving configuration. Please try again.');
      }
    }

    setIsSubmitting(false);
  };

  const handleReset = () => {
    configurationManager.resetToDefaults();
    setSaveMessage('Configuration reset to defaults');
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="configuration-form">
      <h2>Configuration</h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Location Selection */}
        <div className="form-group">
          <label htmlFor="location">
            Location <span className="required">*</span>
          </label>
          <select
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className={errors.location ? 'error' : ''}
            aria-describedby={errors.location ? 'location-error' : undefined}
          >
            <option value="">Select a location</option>
            {supportedLocations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          {errors.location && (
            <div id="location-error" className="error-message" role="alert">
              {errors.location}
            </div>
          )}
        </div>

        {/* Year Selection */}
        <div className="form-group">
          <label htmlFor="year">
            Year <span className="required">*</span>
          </label>
          <select
            id="year"
            value={formData.year}
            onChange={(e) => handleInputChange('year', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            className={errors.year ? 'error' : ''}
            aria-describedby={errors.year ? 'year-error' : undefined}
          >
            <option value="">Select a year</option>
            {yearOptions.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          {errors.year && (
            <div id="year-error" className="error-message" role="alert">
              {errors.year}
            </div>
          )}
        </div>

        {/* Percentage Input */}
        <div className="form-group">
          <label htmlFor="percentage">
            Required In-Office Percentage <span className="required">*</span>
          </label>
          <input
            type="number"
            id="percentage"
            min="0"
            max="100"
            step="1"
            value={formData.inOfficePercentage}
            onChange={(e) => handleInputChange('inOfficePercentage', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className={errors.inOfficePercentage ? 'error' : ''}
            aria-describedby={errors.inOfficePercentage ? 'percentage-error' : 'percentage-help'}
          />
          <div id="percentage-help" className="help-text">
            Enter a percentage between 0 and 100
          </div>
          {errors.inOfficePercentage && (
            <div id="percentage-error" className="error-message" role="alert">
              {errors.inOfficePercentage}
            </div>
          )}
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}
            role="alert"
          >
            {saveMessage}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save Configuration'}
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Reset to Defaults
          </button>
        </div>
      </form>
    </div>
  );
};