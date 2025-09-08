// Formatting utilities and color map

/**
 * Format a number as a percentage
 * @param {number} n - The number to format
 * @returns {string} Formatted percentage string
 */
export function formatPercent(n) {
  return `${n > 0 ? '+' : ''}${n}%`;
}

/**
 * Format a number as days
 * @param {number} n - The number of days
 * @returns {string} Formatted days string
 */
export function formatDays(n) {
  return `${n} day${n === 1 ? '' : 's'}`;
}

/**
 * Utility function to concatenate class names
 * @param {...any} args - Class names to concatenate
 * @returns {string} Concatenated class names
 */
export function cn(...args) {
  return args.filter(Boolean).join(' ');
}

export const colors = {
  success: {
    base: 'emerald-500',
    dark: 'emerald-600',
  },
  warning: {
    base: 'amber-500',
    dark: 'amber-600',
  },
  danger: {
    base: 'rose-500',
    dark: 'rose-600',
  },
};
