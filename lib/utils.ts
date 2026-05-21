// lib/utils.ts

/**
 * Safely formats any numeric value into standard Ghanaian Cedi (₵) format.
 * This completely avoids hardcoding raw symbols next to variable injections.
 */
export const formatCedi = (amount: number | string): string => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '₵0.00';

  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(numericAmount);
};