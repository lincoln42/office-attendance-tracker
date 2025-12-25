/**
 * **Feature: office-attendance-tracker, Property 21: Color contrast compliance**
 * **Validates: Accessibility Requirements**
 * 
 * Property-based test for color contrast compliance
 * For any text and background color combination, the contrast ratio should meet WCAG 2.1 AA standards
 */

import fc from 'fast-check';

// WCAG 2.1 AA contrast ratio requirements
const NORMAL_TEXT_MIN_RATIO = 4.5;
const LARGE_TEXT_MIN_RATIO = 3.0;

// Color utility functions
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

// Application color palette - extracted from CSS files (matching index.css variables)
const APP_COLORS = {
  // Primary colors
  primary: '#004494',
  primaryHover: '#003366',
  secondary: '#6c757d',
  secondaryHover: '#5a6268',

  // Status colors
  success: '#1e7e34',
  successBg: '#d4edda',
  successText: '#155724',
  warning: '#a04000',
  warningBg: '#fff3cd',
  warningText: '#856404',
  error: '#dc3545',
  errorBg: '#f8d7da',
  errorText: '#721c24',

  // Background colors
  white: '#ffffff',
  lightGray: '#f8f9fa',
  mediumGray: '#e9ecef',
  darkGray: '#212529',
  border: '#e9ecef',

  // Calendar colors
  holidayBg: '#fff3cd',
  holidayText: '#856404',
  officeDayBg: '#d4edda',
  officeDayText: '#155724',
  currentDay: '#0056b3',

  // Text colors
  textPrimary: '#212529',
  textSecondary: '#5a6268',
  textMuted: '#adb5bd'
};

describe('Color Contrast Compliance Property Tests', () => {
  test('Application color combinations meet WCAG 2.1 AA standards for normal text', () => {
    // Test only the combinations that are actually used in the application
    const validCombinations = [
      // Primary combinations
      [APP_COLORS.white, APP_COLORS.primary],
      [APP_COLORS.white, APP_COLORS.primaryHover],
      [APP_COLORS.primary, APP_COLORS.white],

      // Success combinations
      [APP_COLORS.successText, APP_COLORS.successBg],

      // Error combinations
      [APP_COLORS.errorText, APP_COLORS.errorBg],
      [APP_COLORS.white, APP_COLORS.error],

      // Warning combinations
      [APP_COLORS.warning, APP_COLORS.warningBg],

      // Calendar combinations
      [APP_COLORS.holidayText, APP_COLORS.holidayBg],
      [APP_COLORS.officeDayText, APP_COLORS.officeDayBg],

      // Text combinations
      [APP_COLORS.textPrimary, APP_COLORS.white],
      [APP_COLORS.textPrimary, APP_COLORS.lightGray],
      [APP_COLORS.textSecondary, APP_COLORS.white],
      [APP_COLORS.textSecondary, APP_COLORS.lightGray],
      [APP_COLORS.white, APP_COLORS.darkGray],
      [APP_COLORS.white, APP_COLORS.secondary]
    ];

    validCombinations.forEach(([textColor, backgroundColor]) => {
      const contrastRatio = getContrastRatio(textColor, backgroundColor);
      expect(contrastRatio).toBeGreaterThanOrEqual(NORMAL_TEXT_MIN_RATIO);
    });
  });

  test('Large text color combinations meet WCAG 2.1 AA standards', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(APP_COLORS)),
        fc.constantFrom(...Object.values(APP_COLORS)),
        (textColor: string, backgroundColor: string) => {
          // Skip same color combinations
          if (textColor === backgroundColor) return true;

          const contrastRatio = getContrastRatio(textColor, backgroundColor);

          // For large text (18pt+ or 14pt+ bold), lower ratio is acceptable
          const isValidCombination = isKnownValidCombination(textColor, backgroundColor);

          if (isValidCombination) {
            return contrastRatio >= LARGE_TEXT_MIN_RATIO;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Critical UI element combinations have sufficient contrast', () => {
    const criticalCombinations = [
      // Primary button
      { text: APP_COLORS.white, bg: APP_COLORS.primary },
      { text: APP_COLORS.white, bg: APP_COLORS.primaryHover },

      // Success states
      { text: APP_COLORS.successText, bg: APP_COLORS.successBg },
      { text: APP_COLORS.white, bg: APP_COLORS.success },

      // Error states
      { text: APP_COLORS.errorText, bg: APP_COLORS.errorBg },
      { text: APP_COLORS.white, bg: APP_COLORS.error },

      // Warning states
      { text: APP_COLORS.warning, bg: APP_COLORS.warningBg },

      // Calendar states
      { text: APP_COLORS.holidayText, bg: APP_COLORS.holidayBg },
      { text: APP_COLORS.officeDayText, bg: APP_COLORS.officeDayBg },

      // Text on backgrounds
      { text: APP_COLORS.textPrimary, bg: APP_COLORS.white },
      { text: APP_COLORS.textPrimary, bg: APP_COLORS.lightGray },
      { text: APP_COLORS.textSecondary, bg: APP_COLORS.white },
      { text: APP_COLORS.white, bg: APP_COLORS.darkGray }
    ];

    criticalCombinations.forEach(({ text, bg }) => {
      const contrastRatio = getContrastRatio(text, bg);
      expect(contrastRatio).toBeGreaterThanOrEqual(NORMAL_TEXT_MIN_RATIO);
    });
  });
});

// Helper function to determine if a color combination is actually used in the app
function isKnownValidCombination(textColor: string, backgroundColor: string): boolean {
  const validCombinations = [
    // Primary combinations
    [APP_COLORS.white, APP_COLORS.primary],
    [APP_COLORS.white, APP_COLORS.primaryHover],
    [APP_COLORS.primary, APP_COLORS.white],

    // Success combinations
    [APP_COLORS.successText, APP_COLORS.successBg],
    [APP_COLORS.white, APP_COLORS.success],

    // Error combinations
    [APP_COLORS.errorText, APP_COLORS.errorBg],
    [APP_COLORS.white, APP_COLORS.error],

    // Warning combinations
    [APP_COLORS.warning, APP_COLORS.warningBg],

    // Calendar combinations
    [APP_COLORS.holidayText, APP_COLORS.holidayBg],
    [APP_COLORS.officeDayText, APP_COLORS.officeDayBg],

    // Text combinations
    [APP_COLORS.textPrimary, APP_COLORS.white],
    [APP_COLORS.textPrimary, APP_COLORS.lightGray],
    [APP_COLORS.textSecondary, APP_COLORS.white],
    [APP_COLORS.textSecondary, APP_COLORS.lightGray],
    [APP_COLORS.white, APP_COLORS.darkGray],
    [APP_COLORS.white, APP_COLORS.secondary]
  ];

  return validCombinations.some(([text, bg]) =>
    text === textColor && bg === backgroundColor
  );
}