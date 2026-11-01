/**
 * Rent calculation utilities for PG management
 * Handles countdown, color gradients, overdue tracking, and payment calculations
 */

export interface NextPaymentInfo {
  daysLeft: number;
  nextDueDate: Date;
  amount: number;
  color: string;
  bgColor: string;
  textColor: string;
  isOverdue: boolean;
  label: string;
  daysLate: number;
  hasPendingRent: boolean;
}

/**
 * Calculate days remaining or days late for rent payment
 * If resident has pending/unpaid rent, highlights exactly how many days late it is.
 */
export function calculateNextRentDue(
  joiningDate: Date | string,
  billingMode: 'calendar' | 'joining_cycle' = 'joining_cycle',
  monthlyRent: number = 7000,
  pendingAmount: number = 0,
  oldestDueDate?: Date | string | null
): NextPaymentInfo {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const joining = new Date(joiningDate);
  joining.setHours(0, 0, 0, 0);

  const hasPendingRent = pendingAmount > 0;

  // 1. If resident has pending rent, target the oldest unpaid due date
  if (hasPendingRent) {
    let targetDueDate: Date;

    if (oldestDueDate) {
      targetDueDate = new Date(oldestDueDate);
      targetDueDate.setHours(0, 0, 0, 0);
    } else if (billingMode === 'calendar') {
      // Calendar mode: First month due on 1st of next month, or joining month 1st
      targetDueDate = new Date(joining.getFullYear(), joining.getMonth(), 1);
      if (today > targetDueDate) {
        // If passed, target was on joining month
      }
    } else {
      // Joining cycle: Target due on joining day
      targetDueDate = new Date(joining);
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    const diffDays = Math.floor((today.getTime() - targetDueDate.getTime()) / msPerDay);

    if (diffDays > 0) {
      // Overdue / Late by X days
      return {
        daysLeft: 0,
        daysLate: diffDays,
        nextDueDate: targetDueDate,
        amount: pendingAmount,
        color: '#FF3B30',
        bgColor: 'rgba(255, 59, 48, 0.15)',
        textColor: '#FF3B30',
        isOverdue: true,
        label: `${diffDays} ${diffDays === 1 ? 'day' : 'days'} late`,
        hasPendingRent: true,
      };
    } else if (diffDays === 0) {
      // Due today!
      return {
        daysLeft: 0,
        daysLate: 0,
        nextDueDate: targetDueDate,
        amount: pendingAmount,
        color: '#FF3B30',
        bgColor: 'rgba(255, 59, 48, 0.15)',
        textColor: '#FF3B30',
        isOverdue: true,
        label: 'Due today!',
        hasPendingRent: true,
      };
    } else {
      // Due in future
      const daysLeft = Math.abs(diffDays);
      return {
        daysLeft,
        daysLate: 0,
        nextDueDate: targetDueDate,
        amount: pendingAmount,
        color: daysLeft <= 3 ? '#FF3B30' : '#FF9500',
        bgColor: daysLeft <= 3 ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)',
        textColor: daysLeft <= 3 ? '#FF3B30' : '#FF9500',
        isOverdue: false,
        label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
        hasPendingRent: true,
      };
    }
  }

  // 2. If NO pending rent (All previous rents are fully cleared)
  let nextDueDate: Date;

  if (billingMode === 'calendar') {
    // Due on 1st of next month
    nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  } else {
    // Due on next 30-day cycle from joining date
    const daysSinceJoining = Math.floor((today.getTime() - joining.getTime()) / (1000 * 60 * 60 * 24));
    const cyclesPassed = Math.max(0, Math.floor(daysSinceJoining / 30));
    const nextCycleNumber = cyclesPassed + 1;

    nextDueDate = new Date(joining);
    nextDueDate.setDate(nextDueDate.getDate() + nextCycleNumber * 30);
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.max(0, Math.floor((nextDueDate.getTime() - today.getTime()) / msPerDay));

  let color = '#34C759';
  let bgColor = 'rgba(52, 199, 89, 0.1)';
  let textColor = '#34C759';

  if (daysLeft <= 3) {
    color = '#FF3B30';
    bgColor = 'rgba(255, 59, 48, 0.1)';
    textColor = '#FF3B30';
  } else if (daysLeft <= 7) {
    color = '#FF9500';
    bgColor = 'rgba(255, 149, 0, 0.1)';
    textColor = '#FF9500';
  } else if (daysLeft <= 14) {
    color = '#FFCC00';
    bgColor = 'rgba(255, 204, 0, 0.1)';
    textColor = '#B28900';
  }

  return {
    daysLeft,
    daysLate: 0,
    nextDueDate,
    amount: monthlyRent,
    color,
    bgColor,
    textColor,
    isOverdue: false,
    label: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`,
    hasPendingRent: false,
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
