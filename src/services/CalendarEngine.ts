import type { CalendarEngine as ICalendarEngine, MonthData, HolidayData } from '../types';

export class CalendarEngine implements ICalendarEngine {
  private holidayData: HolidayData = {
    'UK': {
      2024: [
        new Date(2024, 0, 1),   // New Year's Day
        new Date(2024, 2, 29),  // Good Friday
        new Date(2024, 3, 1),   // Easter Monday
        new Date(2024, 4, 6),   // Early May Bank Holiday
        new Date(2024, 4, 27),  // Spring Bank Holiday
        new Date(2024, 7, 26),  // Summer Bank Holiday
        new Date(2024, 11, 25), // Christmas Day
        new Date(2024, 11, 26)  // Boxing Day
      ],
      2025: [
        new Date(2025, 0, 1),   // New Year's Day
        new Date(2025, 3, 18),  // Good Friday
        new Date(2025, 3, 21),  // Easter Monday
        new Date(2025, 4, 5),   // Early May Bank Holiday
        new Date(2025, 4, 26),  // Spring Bank Holiday
        new Date(2025, 7, 25),  // Summer Bank Holiday
        new Date(2025, 11, 25), // Christmas Day
        new Date(2025, 11, 26)  // Boxing Day
      ]
    },
    'US': {
      2024: [
        new Date(2024, 0, 1),   // New Year's Day
        new Date(2024, 0, 15),  // Martin Luther King Jr. Day
        new Date(2024, 1, 19),  // Presidents' Day
        new Date(2024, 4, 27),  // Memorial Day
        new Date(2024, 5, 19),  // Juneteenth
        new Date(2024, 6, 4),   // Independence Day
        new Date(2024, 8, 2),   // Labor Day
        new Date(2024, 9, 14),  // Columbus Day
        new Date(2024, 10, 11), // Veterans Day
        new Date(2024, 10, 28), // Thanksgiving
        new Date(2024, 11, 25)  // Christmas Day
      ],
      2025: [
        new Date(2025, 0, 1),   // New Year's Day
        new Date(2025, 0, 20),  // Martin Luther King Jr. Day
        new Date(2025, 1, 17),  // Presidents' Day
        new Date(2025, 4, 26),  // Memorial Day
        new Date(2025, 5, 19),  // Juneteenth
        new Date(2025, 6, 4),   // Independence Day
        new Date(2025, 8, 1),   // Labor Day
        new Date(2025, 9, 13),  // Columbus Day
        new Date(2025, 10, 11), // Veterans Day
        new Date(2025, 10, 27), // Thanksgiving
        new Date(2025, 11, 25)  // Christmas Day
      ]
    },
    'Mexico': {
      2024: [
        new Date(2024, 0, 1),   // New Year's Day
        new Date(2024, 1, 5),   // Constitution Day
        new Date(2024, 2, 18),  // Benito Juárez's Birthday
        new Date(2024, 4, 1),   // Labor Day
        new Date(2024, 8, 16),  // Independence Day
        new Date(2024, 10, 18), // Revolution Day
        new Date(2024, 11, 25)  // Christmas Day
      ],
      2025: [
        new Date(2025, 0, 1),   // New Year's Day
        new Date(2025, 1, 3),   // Constitution Day
        new Date(2025, 2, 17),  // Benito Juárez's Birthday
        new Date(2025, 4, 1),   // Labor Day
        new Date(2025, 8, 16),  // Independence Day
        new Date(2025, 10, 17), // Revolution Day
        new Date(2025, 11, 25)  // Christmas Day
      ]
    }
  };

  getWorkingDays(month: number, year: number): Date[] {
    const workingDays: Date[] = [];
    const daysInMonth = this.getDaysInMonth(month, year);

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      // Exclude weekends (Saturday = 6, Sunday = 0)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(date);
      }
    }

    return workingDays;
  }

  getPublicHolidays(month: number, year: number, location: string): Date[] {
    const locationHolidays = this.holidayData[location];
    if (!locationHolidays || !locationHolidays[year]) {
      return [];
    }

    return locationHolidays[year].filter(holiday =>
      holiday.getMonth() === month - 1
    );
  }

  isWorkingDay(date: Date, location: string): boolean {
    const dayOfWeek = date.getDay();

    // Check if it's a weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Check if it's a public holiday
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const holidays = this.getPublicHolidays(month, year, location);

    return !holidays.some(holiday =>
      holiday.getDate() === date.getDate() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getFullYear() === date.getFullYear()
    );
  }

  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  getDaysInMonth(month: number, year: number): number {
    return new Date(year, month, 0).getDate();
  }

  getMonthData(month: number, year: number, location: string): MonthData {
    const totalDays = this.getDaysInMonth(month, year);
    const allWorkingDays = this.getWorkingDays(month, year);
    const publicHolidays = this.getPublicHolidays(month, year, location);
    const weekends: Date[] = [];

    // Calculate weekends
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekends.push(date);
      }
    }

    // Filter working days to exclude public holidays
    const workingDays = allWorkingDays.filter(workingDay =>
      !publicHolidays.some(holiday =>
        holiday.getDate() === workingDay.getDate() &&
        holiday.getMonth() === workingDay.getMonth() &&
        holiday.getFullYear() === workingDay.getFullYear()
      )
    );

    return {
      totalDays,
      workingDays,
      publicHolidays,
      weekends,
      isLeapYear: this.isLeapYear(year)
    };
  }
}