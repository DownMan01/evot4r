import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

// Philippine timezone
export const PHILIPPINE_TIMEZONE = 'Asia/Manila';

/**
 * Convert UTC date string to Philippine time
 */
export const toPhilippineTime = (dateString: string): Date => {
  return toZonedTime(new Date(dateString), PHILIPPINE_TIMEZONE);
};

/**
 * Format date in Philippine timezone
 */
export const formatPhilippineDate = (
  dateString: string,
  formatString: string = 'MMM dd, yyyy'
): string => {
  return formatInTimeZone(new Date(dateString), PHILIPPINE_TIMEZONE, formatString);
};

/**
 * Format date and time in Philippine timezone
 */
export const formatPhilippineDateTime = (
  dateString: string,
  formatString: string = 'MMM dd, yyyy h:mm a'
): string => {
  return formatInTimeZone(new Date(dateString), PHILIPPINE_TIMEZONE, formatString);
};

/**
 * Get current Philippine time
 */
export const getPhilippineNow = (): Date => {
  return toZonedTime(new Date(), PHILIPPINE_TIMEZONE);
};

/**
 * Format time ago in Philippine timezone
 */
export const formatTimeAgoPhilippine = (dateString: string): string => {
  const now = getPhilippineNow();
  const notificationDate = toPhilippineTime(dateString);
  const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / 60000);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
  
  // For older dates, show the actual date
  return formatPhilippineDate(dateString, 'MMM dd');
};

/**
 * Calculate progress between two dates in Philippine time
 */
export const calculateProgressPhilippine = (startDate: string, endDate: string): number => {
  const now = getPhilippineNow();
  const start = toPhilippineTime(startDate);
  const end = toPhilippineTime(endDate);
  
  const total = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  
  return Math.min(Math.max(elapsed / total, 0), 1);
};