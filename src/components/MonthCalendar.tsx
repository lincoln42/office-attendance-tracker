import React from 'react';
import { CalendarEngine } from '../services/CalendarEngine';
import { AttendanceTracker } from '../services/AttendanceTracker';
import './MonthCalendar.css';

interface MonthCalendarProps {
  month: number;
  year: number;
  location?: string;
  markedOfficeDays?: number[];
  calendarEngine?: CalendarEngine;
  attendanceTracker?: AttendanceTracker;
  onDayClick?: (date: Date) => void;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  month,
  year,
  location = 'UK',
  markedOfficeDays = [],
  calendarEngine = new CalendarEngine(),
  attendanceTracker,
  onDayClick
}) => {
  const monthData = calendarEngine.getMonthData(month, year, location);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month - 1;
  const currentDay = isCurrentMonth ? today.getDate() : null;

  const handleDayClick = (day: number) => {
    const date = new Date(year, month - 1, day);

    // Only allow clicking on working days
    if (calendarEngine.isWorkingDay(date, location)) {
      if (onDayClick) {
        onDayClick(date);
      } else if (attendanceTracker) {
        // Toggle attendance if attendanceTracker is provided
        if (attendanceTracker.isOfficeDay(date)) {
          attendanceTracker.unmarkOfficeDay(date);
        } else {
          attendanceTracker.markOfficeDay(date);
        }
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, day: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDayClick(day);
    }
  };

  const getDayClass = (day: number): string => {
    const date = new Date(year, month - 1, day);
    const classes = ['calendar-day'];

    // Check if it's a weekend
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      classes.push('weekend');
    }

    // Check if it's a holiday
    const isHoliday = monthData.publicHolidays.some(holiday =>
      holiday.getDate() === day &&
      holiday.getMonth() === month - 1 &&
      holiday.getFullYear() === year
    );
    if (isHoliday) {
      classes.push('holiday', 'public-holiday');
    }

    // Check if it's a working day
    const isWorking = calendarEngine.isWorkingDay(date, location);
    if (isWorking) {
      classes.push('working-day');
    }

    // Check if it's marked as office day
    const isMarkedOfficeDay = markedOfficeDays.includes(day) ||
      (attendanceTracker && attendanceTracker.isOfficeDay(date));
    if (isMarkedOfficeDay) {
      classes.push('office-day', 'marked', 'attended');
    }

    // Check if it's today
    if (currentDay === day) {
      classes.push('current-day', 'today');
    }

    return classes.join(' ');
  };

  const getDayAttributes = (day: number) => {
    const date = new Date(year, month - 1, day);
    const isWorkingDay = calendarEngine.isWorkingDay(date, location);
    const isHoliday = monthData.publicHolidays.some(holiday =>
      holiday.getDate() === day &&
      holiday.getMonth() === month - 1 &&
      holiday.getFullYear() === year
    );
    const isMarkedOfficeDay = markedOfficeDays.includes(day) ||
      (attendanceTracker && attendanceTracker.isOfficeDay(date));
    const isToday = currentDay === day;

    const attributes: Record<string, unknown> = {
      'data-day': day
    };

    // Add holiday attribute
    if (isHoliday) {
      attributes['data-holiday'] = 'true';
    }

    // Add office day attribute
    if (isMarkedOfficeDay) {
      attributes['data-office-day'] = 'true';
    }

    // All days use gridcell role for proper ARIA compliance
    attributes.role = 'gridcell';

    // Add accessibility attributes for working days
    if (isWorkingDay) {
      attributes.tabIndex = 0;
      attributes.onKeyDown = (event: React.KeyboardEvent) => handleKeyDown(event, day);

      // Create descriptive aria-label
      let ariaLabel = `${monthNames[month - 1]} ${day}, ${year}`;
      if (isToday) {
        ariaLabel += ', today';
      }
      if (isMarkedOfficeDay) {
        ariaLabel += ', marked as office day';
      } else {
        ariaLabel += ', working day';
      }
      if (isHoliday) {
        ariaLabel += ', public holiday';
      }

      attributes['aria-label'] = ariaLabel;
      attributes['aria-pressed'] = isMarkedOfficeDay;
    } else {
      // Non-interactive days
      let ariaLabel = `${monthNames[month - 1]} ${day}, ${year}`;
      if (isHoliday) {
        ariaLabel += ', public holiday';
      } else {
        ariaLabel += ', weekend';
      }
      attributes['aria-label'] = ariaLabel;
    }

    return attributes;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Get the first day of the month and calculate padding
  const firstDay = new Date(year, month - 1, 1);
  const startingDayOfWeek = firstDay.getDay();

  // Create array of days to display (including padding)
  const daysToShow = [];

  // Add padding days from previous month
  for (let i = 0; i < startingDayOfWeek; i++) {
    daysToShow.push(null);
  }

  // Add all days of the current month
  for (let day = 1; day <= monthData.totalDays; day++) {
    daysToShow.push(day);
  }

  // Group days into weeks (rows of 7)
  const weeks = [];
  for (let i = 0; i < daysToShow.length; i += 7) {
    weeks.push(daysToShow.slice(i, i + 7));
  }

  return (
    <div className="month-calendar">
      <div className="calendar-header">
        <h2>{monthNames[month - 1]} {year}</h2>
      </div>

      <div className="calendar-grid" role="grid" aria-label={`Calendar for ${monthNames[month - 1]} ${year}`}>
        {/* Week day headers */}
        <div className="week-header" role="row">
          {weekDays.map(day => (
            <div key={day} className="week-day-header" role="columnheader">
              <abbr title={['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][weekDays.indexOf(day)]}>
                {day}
              </abbr>
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        <div className="calendar-days">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week" role="row">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={day ? getDayClass(day) : 'calendar-day empty'}
                  {...(day ? getDayAttributes(day) : { role: 'gridcell' })}
                  onClick={day ? () => handleDayClick(day) : undefined}
                >
                  {day || ''}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};