import type { Configuration, ConfigurationManager as IConfigurationManager } from '../types';

type ConfigurationChangeListener = (configuration: Configuration) => void;

export class ConfigurationManager implements IConfigurationManager {
  private configuration: Configuration;
  private listeners: ConfigurationChangeListener[] = [];
  private readonly supportedLocations = ['UK', 'US', 'Mexico'];

  constructor() {
    // Initialize with default configuration (current year, default location)
    this.configuration = this.getDefaultConfiguration();
  }

  private getDefaultConfiguration(): Configuration {
    return {
      location: 'UK', // Default location
      year: new Date().getFullYear(), // Current year
      inOfficePercentage: 60 // Default percentage
    };
  }

  private notifyListeners(): void {
    const configCopy = { ...this.configuration };
    this.listeners.forEach(listener => {
      try {
        listener(configCopy);
      } catch (error) {
        console.error('Error in configuration change listener:', error);
      }
    });
  }

  setLocation(location: string): void {
    if (!this.supportedLocations.includes(location)) {
      throw new Error(`Unsupported location: ${location}. Supported locations: ${this.supportedLocations.join(', ')}`);
    }

    const previousLocation = this.configuration.location;
    this.configuration.location = location;

    // Only notify if location actually changed
    if (previousLocation !== location) {
      this.notifyListeners();
    }
  }

  setYear(year: number): void {
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      throw new Error('Year must be a valid integer between 1900 and 2100');
    }

    const previousYear = this.configuration.year;
    this.configuration.year = year;

    // Only notify if year actually changed
    if (previousYear !== year) {
      this.notifyListeners();
    }
  }

  setInOfficePercentage(percentage: number): void {
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be a number between 0 and 100');
    }

    const previousPercentage = this.configuration.inOfficePercentage;
    this.configuration.inOfficePercentage = percentage;

    // Only notify if percentage actually changed
    if (previousPercentage !== percentage) {
      this.notifyListeners();
    }
  }

  getConfiguration(): Configuration {
    return { ...this.configuration };
  }

  getSupportedLocations(): string[] {
    return [...this.supportedLocations];
  }

  addConfigurationChangeListener(listener: ConfigurationChangeListener): void {
    this.listeners.push(listener);
  }

  removeConfigurationChangeListener(listener: ConfigurationChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  resetToDefaults(): void {
    const defaultConfig = this.getDefaultConfiguration();
    const hasChanged =
      this.configuration.location !== defaultConfig.location ||
      this.configuration.year !== defaultConfig.year ||
      this.configuration.inOfficePercentage !== defaultConfig.inOfficePercentage;

    this.configuration = defaultConfig;

    if (hasChanged) {
      this.notifyListeners();
    }
  }
}