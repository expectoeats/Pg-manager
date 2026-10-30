/**
 * Rent calculation utilities for PG management
 * Handles countdown, color gradients, and next payment calculations
 */

interface NextPaymentInfo {
  daysLeft: number;
  nextDueDate: Date;
  amount: number;
  color: string;
  bgColor: string;
  textColor: string;
  isOverdue: boolean;
  label: string;
}

/**
 * Calculate days remaining until next rent payment
 * Returns color-coded countdown with gradient: Green → Yellow → Orange → Red
 */
export function calculateNextRentDue(
  joiningDate: Date | string,
  billingMode: 'calendar' | 'joining_cycle' = 'joining_cycle',
  monthlyRent: number = 7000,
  lastPaidDate?: Date | string
): NextPaymentInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison

  const joining = new Date(joiningDate);
  let nextDueDate: Date;

  if (billingMode === 'calendar') {
    // Calendar mode: Due on 1st of next month
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    nextDueDate = nextMonth;
  } else {
    // Joining cycle: Due every 30 days from joining date
    const daysSinceJoining = Math.floor((today.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));
    const cyclesPassed = Math.floor(daysSinceJoining / 30);
    const nextCycleNumber = cyclesPassed + 1;
    
    nextDueDate = new Date(joining);
    nextDueDate.setDate(nextDueDate.getDate() + (nextCycleNumber * 30));
  }

  // Calculate days left
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.floor((nextDueDate.getTime() - today.getTime()) / msPerDay);

  // Determine color based on days left
  let color: string;
  let bgColor: string;
  let textColor: string;
  let label: string;
  let isOverdue = false;

  if (daysLeft < 0) {
    // Overdue
    color = '#FF3B30';
    bgColor = 'rgba(255, 59, 48, 0.15)';
    textColor = '#FF3B30';
    label = `${Math.abs(daysLeft)} days overdue`;
    isOverdue = true;
  } else if (daysLeft === 0) {
    // Due today
    color = '#FF3B30';
    bgColor = 'rgba(255, 59, 48, 0.15)';
    textColor = '#FF3B30';
    label = 'Due today!';
  } else if (daysLeft <= 2) {
    // 1-2 days: Red
    color = '#FF3B30';
    bgColor = 'rgba(255, 59, 48, 0.1)';
    textColor = '#FF3B30';
    label = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  } else if (daysLeft <= 5) {
    // 3-5 days: Orange
    color = '#FF9500';
    bgColor = 'rgba(255, 149, 0, 0.1)';
    textColor = '#FF9500';
    label = `${daysLeft} days left`;
  } else if (daysLeft <= 10) {
    // 6-10 days: Yellow
    color = '#FFCC00';
    bgColor = 'rgba(255, 204, 0, 0.1)';
    textColor = '#FFCC00';
    label = `${daysLeft} days left`;
  } else if (daysLeft <= 20) {
    // 11-20 days: Yellow-Green
    color = '#8BC34A';
    bgColor = 'rgba(139, 195, 74, 0.1)';
    textColor = '#689F38';
    label = `${daysLeft} days left`;
  } else {
    // 21+ days: Green
    color = '#34C759';
    bgColor = 'rgba(52, 199, 89, 0.1)';
    textColor = '#34C759';
    label = `${daysLeft} days left`;
  }

  return {
    daysLeft,
    nextDueDate,
    amount: monthlyRent,
    color,
    bgColor,
    textColor,
    isOverdue,
    label,
  };
}

/**
 * Get status badge color based on rent status
 */
export function getRentStatusColor(status: 'paid' | 'partial' | 'pending'): {
  bg: string;
  text: string;
  label: string;
} {
  switch (status) {
    case 'paid':
      return {
        bg: 'rgba(52, 199, 89, 0.1)',
        text: '#34C759',
        label: 'Paid',
      };
    case 'partial':
      return {
        bg: 'rgba(255, 149, 0, 0.1)',
        text: '#FF9500',
        label: 'Partial',
      };
    case 'pending':
      return {
        bg: 'rgba(255, 59, 48, 0.1)',
        text: '#FF3B30',
        label: 'Pending',
      };
  }
}
