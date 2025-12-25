import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProgressDisplay } from '../ProgressDisplay';
import type { AttendanceStatus } from '../../types';

describe('ProgressDisplay', () => {
  const createMockStatus = (overrides: Partial<AttendanceStatus> = {}): AttendanceStatus => ({
    requiredDays: 10,
    completedDays: 5,
    remainingDays: 5,
    isOnTrack: false,
    annualLeaveDays: 2,
    ...overrides
  });

  describe('Progress calculation display', () => {
    it('displays correct required days', () => {
      const status = createMockStatus({ requiredDays: 15 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('required-days').textContent).toBe('15');
    });

    it('displays correct completed days', () => {
      const status = createMockStatus({ completedDays: 8 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('completed-days').textContent).toBe('8');
    });

    it('displays remaining days when greater than 0', () => {
      const status = createMockStatus({ remainingDays: 3 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('remaining-days').textContent).toBe('3');
    });

    it('does not display remaining days when 0', () => {
      const status = createMockStatus({ remainingDays: 0 });
      render(<ProgressDisplay status={status} />);

      expect(screen.queryByTestId('remaining-days')).toBeFalsy();
    });

    it('displays annual leave days when greater than 0', () => {
      const status = createMockStatus({ annualLeaveDays: 4 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('annual-leave-days').textContent).toBe('4');
    });

    it('does not display annual leave days when 0', () => {
      const status = createMockStatus({ annualLeaveDays: 0 });
      render(<ProgressDisplay status={status} />);

      expect(screen.queryByTestId('annual-leave-days')).toBeFalsy();
    });

    it('calculates correct progress percentage', () => {
      const status = createMockStatus({ requiredDays: 10, completedDays: 7 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('progress-percentage').textContent).toBe('70%');
    });

    it('caps progress percentage at 100%', () => {
      const status = createMockStatus({ requiredDays: 10, completedDays: 15 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('progress-percentage').textContent).toBe('100%');
    });

    it('shows 0% when no required days', () => {
      const status = createMockStatus({ requiredDays: 0, completedDays: 0 });
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('progress-percentage').textContent).toBe('0%');
    });
  });

  describe('Status indicator rendering', () => {
    it('shows "On Track" status when isOnTrack is true', () => {
      const status = createMockStatus({ isOnTrack: true });
      render(<ProgressDisplay status={status} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toBe('On Track');
      expect(statusElement.className).toContain('status-on-track');
    });

    it('shows "Behind" status when not on track and not ahead', () => {
      const status = createMockStatus({
        isOnTrack: false,
        requiredDays: 10,
        completedDays: 5
      });
      render(<ProgressDisplay status={status} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toBe('Behind');
      expect(statusElement.className).toContain('status-behind');
    });

    it('shows "Ahead" status when completed days exceed required days', () => {
      const status = createMockStatus({
        requiredDays: 10,
        completedDays: 12,
        isOnTrack: true
      });
      render(<ProgressDisplay status={status} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toBe('Ahead');
      expect(statusElement.className).toContain('status-ahead');
    });

    it('shows "No Requirements" status when required days is 0', () => {
      const status = createMockStatus({ requiredDays: 0, completedDays: 0 });
      render(<ProgressDisplay status={status} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.textContent).toBe('No Requirements');
      expect(statusElement.className).toContain('status-none');
    });
  });

  describe('Progress bar accuracy', () => {
    it('sets correct width for progress bar fill', () => {
      const status = createMockStatus({ requiredDays: 10, completedDays: 3 });
      render(<ProgressDisplay status={status} />);

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill.style.width).toBe('30%');
    });

    it('sets correct color for on track status', () => {
      const status = createMockStatus({
        requiredDays: 10,
        completedDays: 10,
        isOnTrack: true
      });
      render(<ProgressDisplay status={status} />);

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill.style.backgroundColor).toBe('rgb(76, 175, 80)');
    });

    it('sets correct color for ahead status', () => {
      const status = createMockStatus({
        requiredDays: 10,
        completedDays: 12
      });
      render(<ProgressDisplay status={status} />);

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill.style.backgroundColor).toBe('rgb(33, 150, 243)');
    });

    it('sets correct color for behind status', () => {
      const status = createMockStatus({
        requiredDays: 10,
        completedDays: 5,
        isOnTrack: false
      });
      render(<ProgressDisplay status={status} />);

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill.style.backgroundColor).toBe('rgb(255, 152, 0)');
    });

    it('sets correct color for no requirements', () => {
      const status = createMockStatus({ requiredDays: 0, completedDays: 0 });
      render(<ProgressDisplay status={status} />);

      const progressFill = screen.getByTestId('progress-bar-fill');
      expect(progressFill.style.backgroundColor).toBe('rgb(224, 224, 224)');
    });

    it('has proper ARIA attributes for progress bar', () => {
      const status = createMockStatus({ requiredDays: 10, completedDays: 7 });
      render(<ProgressDisplay status={status} />);

      const progressBar = screen.getByTestId('progress-bar');
      expect(progressBar.getAttribute('role')).toBe('progressbar');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('70');
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressBar.getAttribute('aria-label')).toBe('Progress: 70% complete');
    });
  });

  describe('Component variants', () => {
    it('applies monthly variant class by default', () => {
      const status = createMockStatus();
      const { container } = render(<ProgressDisplay status={status} />);

      expect((container.firstChild as HTMLElement)?.className).toContain('progress-display-monthly');
    });

    it('applies yearly variant class when specified', () => {
      const status = createMockStatus();
      const { container } = render(<ProgressDisplay status={status} variant="yearly" />);

      expect((container.firstChild as HTMLElement)?.className).toContain('progress-display-yearly');
    });

    it('shows details by default', () => {
      const status = createMockStatus();
      render(<ProgressDisplay status={status} />);

      expect(screen.getByTestId('required-days')).toBeTruthy();
      expect(screen.getByTestId('completed-days')).toBeTruthy();
    });

    it('hides details when showDetails is false', () => {
      const status = createMockStatus();
      render(<ProgressDisplay status={status} showDetails={false} />);

      expect(screen.queryByTestId('required-days')).toBeFalsy();
      expect(screen.queryByTestId('completed-days')).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('provides proper status role for status indicator', () => {
      const status = createMockStatus({ isOnTrack: true });
      render(<ProgressDisplay status={status} />);

      const statusElement = screen.getByRole('status');
      expect(statusElement.getAttribute('aria-label')).toBe('Status: On Track');
    });

    it('provides proper progressbar role and attributes', () => {
      const status = createMockStatus({ requiredDays: 20, completedDays: 15 });
      render(<ProgressDisplay status={status} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar.getAttribute('aria-valuenow')).toBe('75');
      expect(progressBar.getAttribute('aria-valuemin')).toBe('0');
      expect(progressBar.getAttribute('aria-valuemax')).toBe('100');
      expect(progressBar.getAttribute('aria-label')).toBe('Progress: 75% complete');
    });
  });
});