import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} dirty - Unsanitized HTML string
 * @param {object} options - DOMPurify configuration options
 * @returns {string} - Sanitized HTML string
 */
export const sanitizeHTML = (dirty, options = {}) => {
  const defaultOptions = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options
  };

  return DOMPurify.sanitize(dirty, defaultOptions);
};

/**
 * Sanitize text content (strips all HTML)
 * @param {string} dirty - Unsanitized string
 * @returns {string} - Plain text string
 */
export const sanitizeText = (dirty) => {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
};

/**
 * Sanitize user input for display
 * @param {string} input - User input
 * @returns {string} - Sanitized string safe for display
 */
export const sanitizeUserInput = (input) => {
  if (!input) return '';
  
  // Convert to string if not already
  const str = String(input);
  
  // Escape HTML entities
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitize URL to prevent javascript: and data: protocols
 * @param {string} url - URL to sanitize
 * @returns {string} - Safe URL or empty string
 */
export const sanitizeURL = (url) => {
  if (!url) return '';
  
  const str = String(url).trim().toLowerCase();
  
  // Block dangerous protocols
  if (str.startsWith('javascript:') || 
      str.startsWith('data:') || 
      str.startsWith('vbscript:')) {
    return '';
  }
  
  return url;
};

export default {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserInput,
  sanitizeURL
};
