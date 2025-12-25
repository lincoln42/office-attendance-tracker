# Office Attendance Tracker

A modern, accessible web application for tracking office attendance and managing hybrid work schedules. Built with React, TypeScript, and Vite.

## Features

- **Hybrid Work Management**: Track your office attendance against required percentages
- **Multi-Location Support**: Configure settings for different office locations (UK, US, Mexico)
- **Annual Leave Planning**: Set and track annual leave days for each month
- **Interactive Calendar**: Mark attendance days with an intuitive calendar interface
- **Progress Tracking**: Visual progress indicators showing attendance goals
- **Data Persistence**: All data is saved locally in your browser
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd office-attendance-tracker
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:5173`

## How to Use the Application

### Initial Setup

When you first open the application, you'll see the main dashboard with three sections:

1. **Configuration** (left panel)
2. **Annual Leave** (left panel, below configuration)
3. **Progress Overview** (right panel)
4. **Year View** (main area)

### Step 1: Configure Your Settings

1. **Select Your Location**: Choose from UK, US, or Mexico
   - This determines your local holidays and working days
   
2. **Set Required Office Percentage**: Enter the percentage of working days you need to be in the office
   - Example: Enter "60" if you need to be in the office 60% of working days
   
3. **Save Configuration**: Click "Save Configuration" to apply your settings

### Step 2: Set Annual Leave Days

For each month, enter the number of annual leave days you plan to take:

1. Use the number inputs next to each month name
2. Enter the number of leave days (0-31)
3. Your settings are automatically saved

### Step 3: Track Your Attendance

#### Year View (Default)
- See all 12 months at a glance
- Each month shows:
  - Total working days
  - Required office days (based on your percentage)
  - Current progress (green progress bar)
  - Annual leave days taken

#### Month View (Detailed Calendar)
1. **Navigate to Month View**: Click on any month card in the year view
2. **Mark Attendance**: 
   - Click on working days (blue) to mark them as office days
   - Marked days turn green and show "marked as office day"
   - Click again to unmark if needed
3. **View Progress**: The progress bar shows your current attendance vs. required
4. **Return to Year View**: Click "← Back to Year View"

### Understanding the Calendar

- **Green days**: Weekends and holidays (non-working days)
- **Blue days**: Working days (available for marking attendance)
- **Green with checkmark**: Days marked as office attendance
- **Gray days**: Annual leave days (automatically excluded from calculations)

### Navigation Tips

- **Keyboard Navigation**: Use Tab, Enter, and arrow keys to navigate
- **Screen Reader Support**: All elements have proper labels and descriptions
- **Mobile Friendly**: Touch-friendly interface on mobile devices

### Data Management

- **Automatic Saving**: All your data is automatically saved to your browser's local storage
- **Data Persistence**: Your settings and attendance data persist between sessions
- **Privacy**: All data stays on your device - nothing is sent to external servers

## Troubleshooting

### Local Storage Issues
If you see a warning about local storage not being available:
- Check if your browser allows local storage
- Ensure you're not in private/incognito mode
- The app will still function but won't save your data

### Browser Compatibility
The application works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Available Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Testing
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint         # Run ESLint
```

## Technical Details

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Testing**: Jest with React Testing Library
- **Accessibility**: WCAG 2.1 AA compliant
- **Browser Storage**: Local Storage API
- **Responsive**: CSS Grid and Flexbox

## Support

If you encounter any issues or have questions about using the application, please check:

1. **Browser Console**: Look for any error messages
2. **Local Storage**: Ensure your browser supports and allows local storage
3. **JavaScript**: Ensure JavaScript is enabled in your browser

## Privacy

This application:
- Stores all data locally in your browser
- Does not send any data to external servers
- Does not track or collect personal information
- Works completely offline after initial load
