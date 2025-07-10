import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

interface StreakCalendarProps {
  currentDate: Date;
  writingDays: Date[];
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({ currentDate, writingDays }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const isWritingDay = (date: Date) => {
    return writingDays.some(day => isSameDay(day, date));
  };

  const getDayClass = (date: Date) => {
    const baseClass = "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors";
    
    if (!isSameMonth(date, currentDate)) {
      return `${baseClass} text-neutral-300`;
    }
    
    if (isWritingDay(date)) {
      return `${baseClass} bg-gradient-to-br from-primary-500 to-secondary-500 text-white`;
    }
    
    if (isSameDay(date, new Date())) {
      return `${baseClass} bg-neutral-200 text-neutral-700`;
    }
    
    return `${baseClass} text-neutral-600 hover:bg-neutral-100`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">Writing Calendar</h3>
        <span className="text-sm text-neutral-500">
          {format(currentDate, 'MMMM yyyy')}
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-neutral-500 p-2">
            {day}
          </div>
        ))}
        
        {days.map(day => (
          <div key={day.toISOString()} className="flex justify-center p-1">
            <div className={getDayClass(day)}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded"></div>
            <span className="text-neutral-600">Writing day</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-neutral-200 rounded"></div>
            <span className="text-neutral-600">Today</span>
          </div>
        </div>
        <span className="text-neutral-500">
          {writingDays.length} days this month
        </span>
      </div>
    </div>
  );
};

export default StreakCalendar;