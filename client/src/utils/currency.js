/**
 * Format number as Myanmar Kyat currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show the currency symbol
 * @returns {string} Formatted currency string
 */
export const formatMMK = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '0 Ks' : '0';
  }

  const formatted = Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

  return showSymbol ? `${formatted} Ks` : formatted;
};

/**
 * Format number as compact Myanmar Kyat (e.g., 1.5K, 2.3M)
 * @param {number} amount - The amount to format
 * @returns {string} Compact formatted currency string
 */
export const formatMMKCompact = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 Ks';
  }

  const num = Number(amount);
  
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B Ks`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M Ks`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K Ks`;
  }
  
  return `${num.toLocaleString()} Ks`;
};

/**
 * Parse MMK string to number
 * @param {string} str - The currency string to parse
 * @returns {number} Parsed number
 */
export const parseMMK = (str) => {
  if (!str) return 0;
  return Number(String(str).replace(/[^0-9.-]+/g, ''));
};

/**
 * Currency symbol
 */
export const MMK_SYMBOL = 'Ks';
export const MMK_NAME = 'Myanmar Kyat';
